import { useState, useCallback } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { Button } from '@shared/ui'
import { X } from 'lucide-react'
import { ZoneEditor, type Zone } from './ZoneEditor'
import { FlowEditor, type FlowNodeData, getDefaultProperties } from './FlowEditor'
import { PropertiesPanel } from './PropertiesPanel'
import type { VisionApp } from '@widgets/vision-app-panel'

// Export types for external use
export type { Zone } from './ZoneEditor'
export type { FlowNodeData, FlowNodeType } from './FlowEditor'

// Event configuration output format
export interface EventConfig {
  cameraId: string
  appId: string
  appName: string
  zones: Zone[]
  nodes: {
    id: string
    type: string
    label: string
    properties: Record<string, any>
    position: { x: number; y: number }
  }[]
  edges: {
    id: string
    source: string
    target: string
  }[]
}

interface EventSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  app: VisionApp | null
  cameraId: string
  cameraName: string
  thumbnailUrl?: string
}

// Sample thumbnail for testing
const SAMPLE_THUMBNAIL = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&h=480&fit=crop'

export function EventSettingsDialog({
  isOpen,
  onClose,
  app,
  cameraId,
  cameraName,
  thumbnailUrl = SAMPLE_THUMBNAIL,
}: EventSettingsDialogProps) {
  // Zone state
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

  // Flow state
  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>([
    {
      id: 'object-1',
      type: 'custom',
      position: { x: 100, y: 50 },
      data: { label: 'Object#1', nodeType: 'object', properties: getDefaultProperties('object') },
    },
  ])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null
  const selectedZone = zones.find((z) => z.id === selectedZoneId) || null

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<FlowNodeData>) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    )
  }, [])

  const handleUpdateZone = useCallback((zoneId: string, updates: Partial<Zone>) => {
    setZones((prev) =>
      prev.map((zone) =>
        zone.id === zoneId ? { ...zone, ...updates } : zone
      )
    )
  }, [])

  const handleSelectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId)
    if (nodeId) setSelectedZoneId(null)
  }, [])

  const handleSelectZone = useCallback((zoneId: string | null) => {
    setSelectedZoneId(zoneId)
    if (zoneId) setSelectedNodeId(null)
  }, [])

  // When a zone is created, automatically add a zone node to the flow editor
  const handleZoneCreated = useCallback((zone: Zone) => {
    // Calculate position for the new zone node
    const zoneNodes = nodes.filter(n => n.data.nodeType === 'zone')
    const yOffset = 50 + (zoneNodes.length * 80)

    const newNode: Node<FlowNodeData> = {
      id: `zone-node-${zone.id}`,
      type: 'custom',
      position: { x: 300, y: yOffset },
      data: {
        label: zone.name,
        nodeType: 'zone',
        properties: {
          ...getDefaultProperties('zone'),
          zoneId: zone.id,
        },
      },
    }
    setNodes((prev) => [...prev, newNode])
  }, [nodes])

  // When a zone is deleted, also remove the corresponding zone node
  const handleDeleteZone = useCallback((zoneId: string) => {
    // Remove zone
    setZones((prev) => prev.filter(z => z.id !== zoneId))
    // Remove corresponding zone node and its edges
    const zoneNodeId = `zone-node-${zoneId}`
    setNodes((prev) => prev.filter(n => n.id !== zoneNodeId))
    setEdges((prev) => prev.filter(e => e.source !== zoneNodeId && e.target !== zoneNodeId))
    if (selectedZoneId === zoneId) setSelectedZoneId(null)
  }, [selectedZoneId])

  const handleSave = () => {
    const config: EventConfig = {
      cameraId,
      appId: app?.id || '',
      appName: app?.name || '',
      zones,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.data.nodeType,
        label: n.data.label,
        properties: n.data.properties,
        position: n.position,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    }

    console.log('=== Event Configuration JSON ===')
    console.log(JSON.stringify(config, null, 2))
    console.log('================================')

    alert('Event configuration logged to console!')
    onClose()
  }

  if (!isOpen || !app) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Event Settings</h2>
            <p className="text-sm text-muted-foreground">
              {app.name} v{app.version} on {cameraName}
            </p>
          </div>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-1 min-h-0">
          {/* Left: Zone Editor */}
          <div className="w-[500px] border-r flex flex-col shrink-0">
            <div className="p-2 border-b text-sm font-medium">Zone Editor</div>
            <div className="flex-1 p-2 overflow-auto">
              <ZoneEditor
                thumbnailUrl={thumbnailUrl}
                zones={zones}
                selectedZoneId={selectedZoneId}
                onZonesChange={setZones}
                onSelectZone={handleSelectZone}
                onZoneCreated={handleZoneCreated}
                width={480}
                height={360}
              />
              {/* Zone list */}
              <div className="mt-2 space-y-1">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`flex items-center justify-between p-2 rounded text-sm cursor-pointer ${
                      zone.id === selectedZoneId ? 'bg-primary/20' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSelectZone(zone.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: zone.color }}
                      />
                      {zone.name}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteZone(zone.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle: Flow Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-2 border-b text-sm font-medium">Flow Editor</div>
            <div className="flex-1">
              <FlowEditor
                nodes={nodes}
                edges={edges}
                onNodesChange={setNodes}
                onEdgesChange={setEdges}
                onSelectNode={handleSelectNode}
                selectedNodeId={selectedNodeId}
                onDeleteZone={handleDeleteZone}
              />
            </div>
          </div>

          {/* Right: Properties Panel */}
          <div className="w-64 border-l shrink-0">
            <div className="p-2 border-b text-sm font-medium">Properties</div>
            <PropertiesPanel
              selectedNode={selectedNode}
              selectedZone={selectedZone}
              zones={zones}
              onUpdateNode={handleUpdateNode}
              onUpdateZone={handleUpdateZone}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSave}>Save & Log JSON</Button>
        </div>
      </div>
    </div>
  )
}

// Re-export old interface for backward compatibility
export type { EventRule } from './types'
