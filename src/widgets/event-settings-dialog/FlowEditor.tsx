import { useCallback, useRef, useEffect, useMemo, useState, type DragEvent } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  ReactFlowProvider,
  useReactFlow,
  type ProOptions,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  SelectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Hide the selection box around selected nodes (but keep drag selection visible)
const hideSelectionBoxStyle = `
  .react-flow__nodesselection-rect {
    display: none !important;
  }
`
import { X } from 'lucide-react'
import { CustomNode, getDefaultNodeData, type FlowNodeData, type FlowNodeType } from './CustomNodes'
import { Toolbox } from './Toolbox'

// Custom edge with delete button (shows on hover)
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
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {/* Wider invisible path for easier hover detection */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <EdgeLabelRenderer>
        <div
          className={`nodrag nopan absolute flex items-center justify-center w-5 h-5 bg-background border border-border rounded-full cursor-pointer hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => {
            e.stopPropagation()
            // Dispatch custom event to delete edge
            window.dispatchEvent(new CustomEvent('deleteEdge', { detail: { id } }))
          }}
        >
          <X className="w-3 h-3" />
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

interface FlowEditorProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  onSelectNode: (nodeId: string | null) => void
  selectedNodeId: string | null
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

const edgeTypes: EdgeTypes = {
  deletable: DeletableEdge,
}

const proOptions: ProOptions = {
  hideAttribution: true,
}

function getNodeId() {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function FlowEditorInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onSelectNode,
  selectedNodeId,
}: FlowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const [internalNodes, setNodes, onNodesChangeInternal] = useNodesState(nodes)
  const [internalEdges, setEdges, onEdgesChangeInternal] = useEdgesState(edges)

  // Refs to track latest state for callbacks
  const nodesRef = useRef(internalNodes)
  const edgesRef = useRef(internalEdges)
  useEffect(() => { nodesRef.current = internalNodes }, [internalNodes])
  useEffect(() => { edgesRef.current = internalEdges }, [internalEdges])

  // Handle edge deletion from custom event
  useEffect(() => {
    const handleDeleteEdge = (e: Event) => {
      const { id } = (e as CustomEvent).detail
      setEdges((eds) => {
        const newEdges = eds.filter((edge) => edge.id !== id)
        onEdgesChange(newEdges)
        return newEdges
      })
    }
    window.addEventListener('deleteEdge', handleDeleteEdge)
    return () => window.removeEventListener('deleteEdge', handleDeleteEdge)
  }, [setEdges, onEdgesChange])

  // Sync internal state when parent's nodes/edges change (e.g., from EventCanvas point updates)
  useEffect(() => {
    // Compare by ID to find data changes
    const needsSync = nodes.some((node) => {
      const internal = internalNodes.find((n) => n.id === node.id)
      if (!internal) return true
      return JSON.stringify(node.data) !== JSON.stringify(internal.data)
    })

    if (needsSync || nodes.length !== internalNodes.length) {
      setNodes(nodes)
    }
  }, [nodes])

  useEffect(() => {
    if (edges.length !== internalEdges.length) {
      setEdges(edges)
    }
  }, [edges])

  // Sync internal state with parent using refs to avoid stale closures
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChangeInternal>[0]) => {
      onNodesChangeInternal(changes)
      // Use requestAnimationFrame to ensure state is updated
      requestAnimationFrame(() => {
        onNodesChange(nodesRef.current)
      })
    },
    [onNodesChangeInternal, onNodesChange]
  )

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChangeInternal>[0]) => {
      onEdgesChangeInternal(changes)
      requestAnimationFrame(() => {
        onEdgesChange(edgesRef.current)
      })
    },
    [onEdgesChangeInternal, onEdgesChange]
  )

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        // Remove existing edge from the same source (only one connection per node)
        const filteredEdges = eds.filter((e) => e.source !== params.source)
        const newEdges = addEdge(
          {
            ...params,
            type: 'deletable',
            animated: true,
            style: { stroke: '#888', strokeWidth: 2 },
          },
          filteredEdges
        )
        onEdgesChange(newEdges)
        return newEdges
      })
    },
    [setEdges, onEdgesChange]
  )

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow') as FlowNodeType
      if (!type) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      // Count existing nodes of same type for naming
      const sameTypeCount = internalNodes.filter(
        (n) => (n.data as FlowNodeData).nodeType === type
      ).length

      const newNode: Node = {
        id: getNodeId(),
        type: 'custom',
        position,
        data: {
          ...getDefaultNodeData(type),
          label: `${type.charAt(0).toUpperCase() + type.slice(1)}#${sameTypeCount + 1}`,
        },
      }

      setNodes((nds) => {
        const newNodes = [...nds, newNode]
        onNodesChange(newNodes)
        return newNodes
      })

      // Select the new node
      onSelectNode(newNode.id)
    },
    [screenToFlowPosition, internalNodes, setNodes, onNodesChange, onSelectNode]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode(node.id)
    },
    [onSelectNode]
  )

  const onPaneClick = useCallback(() => {
    onSelectNode(null)
  }, [onSelectNode])

  const onDragStart = useCallback((event: DragEvent, nodeType: FlowNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  // Handle keyboard delete for selected nodes
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Get all selected nodes
        const selectedNodes = internalNodes.filter(n => n.selected)
        if (selectedNodes.length > 0) {
          const selectedIds = selectedNodes.map(n => n.id)

          setNodes((nds) => {
            const newNodes = nds.filter((n) => !selectedIds.includes(n.id))
            onNodesChange(newNodes)
            return newNodes
          })
          setEdges((eds) => {
            const newEdges = eds.filter((e) => !selectedIds.includes(e.source) && !selectedIds.includes(e.target))
            onEdgesChange(newEdges)
            return newEdges
          })

          if (selectedNodeId && selectedIds.includes(selectedNodeId)) {
            onSelectNode(null)
          }
        }
      }
    },
    [internalNodes, selectedNodeId, setNodes, setEdges, onNodesChange, onEdgesChange, onSelectNode]
  )

  // Compute nodes with validation warnings
  const nodesWithWarnings = useMemo(() => {
    return internalNodes.map((n) => {
      const data = n.data as FlowNodeData
      let warning: string | undefined

      // Object nodes must be connected to Zone or Line
      if (data.nodeType === 'object') {
        const connectedEdge = internalEdges.find((e) => e.source === n.id)
        if (connectedEdge) {
          const targetNode = internalNodes.find((node) => node.id === connectedEdge.target)
          const targetData = targetNode?.data as FlowNodeData | undefined
          if (!targetData || !['zone', 'line'].includes(targetData.nodeType)) {
            warning = 'Must connect to Zone or Line'
          }
        } else {
          warning = 'Must connect to Zone or Line'
        }
      }

      return {
        ...n,
        data: { ...data, warning },
        selected: n.selected || n.id === selectedNodeId,
      }
    })
  }, [internalNodes, internalEdges, selectedNodeId])

  return (
    <div className="flex h-full" onKeyDown={onKeyDown} tabIndex={0}>
      {/* Hide selection box around nodes after selection */}
      <style>{hideSelectionBoxStyle}</style>

      {/* Left: Toolbox */}
      <div className="w-48 border-r shrink-0">
        <Toolbox onDragStart={onDragStart} />
      </div>

      {/* Center: Flow Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodesWithWarnings}
          edges={internalEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'deletable',
            animated: true,
          }}
          proOptions={proOptions}
          // Multi-select: drag for box selection, Space+drag for pan
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          panOnDrag={false}
          panActivationKeyCode="Space"
        >
          <Background gap={15} size={1} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}

export function FlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner {...props} />
    </ReactFlowProvider>
  )
}
