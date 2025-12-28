import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from '@xyflow/react'
import type { Node, Edge, Connection, NodeTypes, IsValidConnection, EdgeTypes, EdgeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { X } from 'lucide-react'

// Node types
export type FlowNodeType = 'object' | 'zone' | 'timeout' | 'count' | 'speed' | 'merge' | 'event' | 'alarm'

export interface FlowNodeData extends Record<string, unknown> {
  label: string
  nodeType: FlowNodeType
  properties: Record<string, unknown>
  onDelete?: (nodeId: string) => void
  nodeId?: string
}

// Custom node component
function CustomNode({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  const getNodeStyle = () => {
    switch (data.nodeType) {
      case 'object':
        return 'border-blue-500 bg-blue-500/10'
      case 'zone':
        return 'border-purple-500 bg-purple-500/10'
      case 'event':
        return 'border-green-500 bg-green-500/10'
      case 'alarm':
        return 'border-gray-500 bg-gray-500/10'
      case 'timeout':
        return 'border-orange-500 bg-orange-500/10'
      case 'count':
        return 'border-yellow-500 bg-yellow-500/10'
      case 'speed':
        return 'border-cyan-500 bg-cyan-500/10'
      case 'merge':
        return 'border-pink-500 bg-pink-500/10'
      default:
        return 'border-gray-500 bg-gray-500/10'
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    data.onDelete?.(id)
  }

  return (
    <div
      className={`px-4 py-2 rounded border-2 min-w-[120px] text-center relative ${getNodeStyle()} ${
        selected ? 'ring-2 ring-white' : ''
      }`}
    >
      {/* Delete button - only show when selected */}
      {selected && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white z-10"
          title="Delete node"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 border-2 border-gray-600"
      />

      {/* Node content */}
      <div className="text-sm font-medium">{data.label}</div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 border-2 border-gray-600"
      />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

// Custom edge with delete button
function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const onDelete = data?.onDelete as ((edgeId: string) => void) | undefined

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            onClick={() => onDelete?.(id)}
            className="w-3 h-3 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
            title="Delete connection"
          >
            <X className="w-2 h-2" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const edgeTypes: EdgeTypes = {
  deletable: DeletableEdge,
}

// Node palette items (Zone is created from Zone Editor, not palette)
const NODE_PALETTE: { type: FlowNodeType; label: string }[] = [
  { type: 'object', label: 'Object' },
  { type: 'event', label: 'Event' },
  { type: 'alarm', label: 'Alarm' },
  { type: 'timeout', label: 'Timeout' },
  { type: 'count', label: 'Count' },
  { type: 'speed', label: 'Speed' },
  { type: 'merge', label: 'Merge' },
]

interface FlowEditorProps {
  nodes: Node<FlowNodeData>[]
  edges: Edge[]
  onNodesChange: (nodes: Node<FlowNodeData>[]) => void
  onEdgesChange: (edges: Edge[]) => void
  onSelectNode: (nodeId: string | null) => void
  selectedNodeId: string | null
  onDeleteZone?: (zoneId: string) => void
}

// Inner component that uses useReactFlow
function FlowEditorInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onSelectNode,
  selectedNodeId,
  onDeleteZone,
}: FlowEditorProps) {
  const [flowNodes, setNodes, onNodesChangeInternal] = useNodesState(nodes as Node[])
  const [flowEdges, setEdges, onEdgesChangeInternal] = useEdgesState(edges)
  const { screenToFlowPosition } = useReactFlow()

  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  // Sync external nodes/edges with internal state
  useEffect(() => {
    setNodes(nodes as Node[])
  }, [nodes, setNodes])

  useEffect(() => {
    setEdges(edges)
  }, [edges, setEdges])

  // Handle edge deletion
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      const newEdges = flowEdges.filter((e) => e.id !== edgeId)
      setEdges(newEdges)
      onEdgesChange(newEdges)
      setSelectedEdgeId(null)
    },
    [flowEdges, setEdges, onEdgesChange]
  )

  // Handle node deletion
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      // Check if it's a zone node and delete the zone too
      if (nodeId.startsWith('zone-node-')) {
        const zoneId = nodeId.replace('zone-node-', '')
        onDeleteZone?.(zoneId)
        // The zone deletion will handle removing the node too
        return
      }

      const newNodes = flowNodes.filter((n) => n.id !== nodeId)
      const newEdges = flowEdges.filter((e) => e.source !== nodeId && e.target !== nodeId)
      setNodes(newNodes as Node[])
      setEdges(newEdges)
      onNodesChange(newNodes as Node<FlowNodeData>[])
      onEdgesChange(newEdges)
      if (selectedNodeId === nodeId) {
        onSelectNode(null)
      }
    },
    [flowNodes, flowEdges, setNodes, setEdges, onNodesChange, onEdgesChange, selectedNodeId, onSelectNode, onDeleteZone]
  )

  // Handle keyboard delete for both nodes and edges
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if user is typing in an input
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
          return
        }
        if (selectedEdgeId) {
          handleDeleteEdge(selectedEdgeId)
        } else if (selectedNodeId) {
          handleDeleteNode(selectedNodeId)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEdgeId, selectedNodeId, handleDeleteEdge, handleDeleteNode])

  // Validate connections
  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      const sourceNode = flowNodes.find((n) => n.id === connection.source)
      const targetNode = flowNodes.find((n) => n.id === connection.target)

      if (!sourceNode || !targetNode) return false

      // Check if source already has an outgoing connection (only one allowed)
      const hasOutgoingEdge = flowEdges.some((e) => e.source === connection.source)
      if (hasOutgoingEdge) return false

      // Check if target already has an incoming connection (only one allowed)
      const hasIncomingEdge = flowEdges.some((e) => e.target === connection.target)
      if (hasIncomingEdge) return false

      const sourceData = sourceNode.data as FlowNodeData
      const targetData = targetNode.data as FlowNodeData

      // Object can only connect to Zone
      if (sourceData.nodeType === 'object') {
        return targetData.nodeType === 'zone'
      }

      // Zone can connect to Event, Timeout, Count, Speed, Merge
      if (sourceData.nodeType === 'zone') {
        return ['event', 'timeout', 'count', 'speed', 'merge'].includes(targetData.nodeType)
      }

      // Event can connect to Alarm
      if (sourceData.nodeType === 'event') {
        return targetData.nodeType === 'alarm'
      }

      // Timeout, Count, Speed can connect to Event or Merge
      if (['timeout', 'count', 'speed'].includes(sourceData.nodeType)) {
        return ['event', 'merge'].includes(targetData.nodeType)
      }

      // Merge can connect to Event
      if (sourceData.nodeType === 'merge') {
        return targetData.nodeType === 'event'
      }

      return false
    },
    [flowNodes, flowEdges]
  )

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, flowEdges)
      setEdges(newEdges)
      onEdgesChange(newEdges)
    },
    [flowEdges, setEdges, onEdgesChange]
  )

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode(node.id)
    },
    [onSelectNode]
  )

  const handlePaneClick = useCallback(() => {
    onSelectNode(null)
    setSelectedEdgeId(null)
  }, [onSelectNode])

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id)
    onSelectNode(null)
  }, [onSelectNode])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const nodeType = event.dataTransfer.getData('nodeType') as FlowNodeType
      if (!nodeType) return

      // Use screenToFlowPosition to correctly convert screen coords to flow coords
      // This handles zoom and pan correctly
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const nodeCount = flowNodes.filter((n) => (n.data as FlowNodeData).nodeType === nodeType).length + 1
      const newNode: Node<FlowNodeData> = {
        id: `${nodeType}-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}#${nodeCount}`,
          nodeType,
          properties: getDefaultProperties(nodeType),
        },
      }

      const newNodes = [...flowNodes, newNode]
      setNodes(newNodes as Node[])
      onNodesChange(newNodes as Node<FlowNodeData>[])
      onSelectNode(newNode.id)
    },
    [flowNodes, setNodes, onNodesChange, onSelectNode, screenToFlowPosition]
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  return (
    <div className="flex h-full">
      {/* Node Palette */}
      <div className="w-32 border-r bg-muted/30 p-2 space-y-2">
        <div className="text-xs font-medium text-muted-foreground mb-2">Nodes</div>
        {NODE_PALETTE.map((item) => (
          <div
            key={item.type}
            className="flex items-center gap-2 p-2 rounded border bg-card cursor-grab hover:bg-muted/50 text-sm"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('nodeType', item.type)
              e.dataTransfer.effectAllowed = 'move'
            }}
          >
            <div className="w-4 h-4 rounded bg-muted" />
            {item.label}
          </div>
        ))}
      </div>

      {/* Flow Canvas */}
      <div className="flex-1" onDrop={handleDrop} onDragOver={handleDragOver}>
        <ReactFlow
          nodes={flowNodes.map((n) => ({
            ...n,
            selected: n.id === selectedNodeId,
            data: { ...(n.data as FlowNodeData), onDelete: handleDeleteNode },
          }))}
          edges={flowEdges.map((e) => ({
            ...e,
            type: 'deletable',
            selected: e.id === selectedEdgeId,
            data: { onDelete: handleDeleteEdge },
          }))}
          onNodesChange={onNodesChangeInternal}
          onEdgesChange={onEdgesChangeInternal}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          isValidConnection={isValidConnection}
          fitView
          className="bg-white"
        >
          <Background color="#e5e7eb" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}

// Wrapper component with ReactFlowProvider
export function FlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner {...props} />
    </ReactFlowProvider>
  )
}

function getDefaultProperties(nodeType: FlowNodeType): Record<string, unknown> {
  switch (nodeType) {
    case 'object':
      return { objectType: 'person', confidence: 0.5 }
    case 'zone':
      return { zoneId: '', detectionPoint: 'center_bottom' }
    case 'timeout':
      return { duration: 5, unit: 'seconds' }
    case 'count':
      return { operator: '>=', value: 1 }
    case 'speed':
      return { operator: '>=', value: 10, unit: 'km/h' }
    case 'merge':
      return { logic: 'and' }
    case 'event':
      return { name: 'Event', severity: 'warning' }
    case 'alarm':
      return { actions: ['notification'] }
    default:
      return {}
  }
}

export { NODE_PALETTE, getDefaultProperties }
