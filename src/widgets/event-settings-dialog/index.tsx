import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@shared/ui'
import { X, Save, RefreshCw, ChevronUp, ChevronDown, LayoutTemplate } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Node, Edge } from '@xyflow/react'
import { inferenceApi } from '@features/inference/api/inference-api'
import { appApi } from '@features/app/api/app-api'
import type { InferenceSettings, EventSetting, EventType } from '@shared/types'
import type { VisionApp } from '@widgets/vision-app-panel'
import { FlowEditor } from './FlowEditor'
import { NodeProperties } from './NodeProperties'
import { EventCanvas } from './EventCanvas'
import { FlowTemplatesModal } from './FlowTemplates'
import type { FlowNodeData, FlowNodeType, AlarmSensorConfig } from './CustomNodes'

interface EventSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  app: VisionApp | null
  cameraId: string
  cameraName: string
}

const SETTINGS_VERSION = '1.7.0'

// Convert API event type to flow node type
function mapEventTypeToNodeType(eventType: EventType): FlowNodeType | null {
  const mapping: Record<string, FlowNodeType | null> = {
    'RoI': 'zone',
    'Line': 'line',
    'And': 'merge',
    'Or': 'merge',
    'Speed': 'speed',
    'Filter': 'count', // Could be count or timeout
    'Alarm': 'alarm',
    'Heatmap': null,
    'Enter-Exit': null,
  }
  return mapping[eventType] ?? null
}

// Convert saved configs to flow nodes and edges
function convertConfigsToFlow(configs: EventSetting[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const processedIds = new Set<string>()

  // First pass: create nodes with auto-layout
  let xPos = 100
  let yPos = 100
  const ROW_HEIGHT = 150
  const COL_WIDTH = 200

  // Group by hierarchy level for positioning
  const rootConfigs = configs.filter(c => !c.parentId)
  const childConfigs = configs.filter(c => c.parentId)

  // Process root nodes first
  rootConfigs.forEach((config, index) => {
    const nodeType = mapEventTypeToNodeType(config.eventType)
    if (!nodeType) return

    // Parse ext for alarm sensors
    let alarmSensors: AlarmSensorConfig[] = []
    if (config.eventType === 'Alarm' && config.ext) {
      try {
        alarmSensors = JSON.parse(config.ext)
      } catch { /* ignore */ }
    }

    nodes.push({
      id: config.eventSettingId,
      type: 'custom',
      position: { x: xPos + index * COL_WIDTH, y: yPos },
      data: {
        label: config.eventSettingName,
        nodeType,
        points: config.points,
        direction: config.direction,
        ncond: config.ncond,
        timeout: config.timeout,
        ext: config.ext,
        alarmSensors,
      } as FlowNodeData,
    })
    processedIds.add(config.eventSettingId)
  })

  // Process child nodes (may need multiple passes for deep hierarchies)
  let currentY = yPos + ROW_HEIGHT
  let remaining = [...childConfigs]
  let maxIterations = 10

  while (remaining.length > 0 && maxIterations > 0) {
    const nextRemaining: EventSetting[] = []

    remaining.forEach((config, index) => {
      // Check if parent is already processed
      if (config.parentId && processedIds.has(config.parentId)) {
        const nodeType = mapEventTypeToNodeType(config.eventType)
        if (!nodeType) return

        // Find parent node position for relative positioning
        const parentNode = nodes.find(n => n.id === config.parentId)
        const parentX = parentNode?.position.x || xPos

        // Parse ext for alarm sensors
        let alarmSensors: AlarmSensorConfig[] = []
        if (config.eventType === 'Alarm' && config.ext) {
          try {
            alarmSensors = JSON.parse(config.ext)
          } catch { /* ignore */ }
        }

        nodes.push({
          id: config.eventSettingId,
          type: 'custom',
          position: { x: parentX + index * 50, y: currentY },
          data: {
            label: config.eventSettingName,
            nodeType,
            points: config.points,
            direction: config.direction,
            ncond: config.ncond,
            timeout: config.timeout,
            ext: config.ext,
            alarmSensors,
          } as FlowNodeData,
        })
        processedIds.add(config.eventSettingId)

        // Create edge from parent
        edges.push({
          id: `e-${config.parentId}-${config.eventSettingId}`,
          source: config.parentId,
          target: config.eventSettingId,
          type: 'deletable',
          animated: true,
          style: { stroke: '#888', strokeWidth: 2 },
        })
      } else {
        nextRemaining.push(config)
      }
    })

    remaining = nextRemaining
    currentY += ROW_HEIGHT
    maxIterations--
  }

  return { nodes, edges }
}

export function EventSettingsDialog({
  isOpen,
  onClose,
  app,
  cameraId,
  cameraName,
}: EventSettingsDialogProps) {
  const queryClient = useQueryClient()

  // State
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load existing inference data
  const { data: inferences, isLoading } = useQuery({
    queryKey: ['inferences', cameraId],
    queryFn: () => inferenceApi.getByVideoId(cameraId),
    enabled: isOpen && !!cameraId,
  })

  // Load saved settings when dialog opens
  useEffect(() => {
    if (!isOpen || !app?.id || !inferences || isLoaded) return

    // Find inference for current app
    const inference = inferences.find(inf => inf.appId === app.id)
    if (inference?.settings?.configs && inference.settings.configs.length > 0) {
      const { nodes: loadedNodes, edges: loadedEdges } = convertConfigsToFlow(inference.settings.configs)
      setNodes(loadedNodes)
      setEdges(loadedEdges)
    }
    setIsLoaded(true)
  }, [isOpen, app?.id, inferences, isLoaded])

  // Reset loaded flag when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoaded(false)
      setNodes([])
      setEdges([])
      setSelectedNodeId(null)
    }
  }, [isOpen])

  // Load app details (for outputs/classifiers)
  const { data: appDetails } = useQuery({
    queryKey: ['app', app?.id],
    queryFn: () => appApi.getById(app!.id),
    enabled: isOpen && !!app?.id,
  })

  // Load preview image
  useEffect(() => {
    if (!isOpen || !app?.id || !cameraId) return

    let cancelled = false

    inferenceApi.getPreview(app.id, cameraId).then((url) => {
      if (!cancelled) setPreviewUrl(url)
    }).catch(() => {
      // Fallback to sample image
      if (!cancelled) setPreviewUrl('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&h=480&fit=crop')
    })

    return () => {
      cancelled = true
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [isOpen, app?.id, cameraId])

  // Convert flow nodes/edges to API format
  const convertToApiFormat = useCallback((): InferenceSettings => {
    // Helper to find parent Object node and build target
    const findParentObjectTarget = (nodeId: string): { label: string; classType: string | null; resultLabel: string[] | null } | undefined => {
      // Traverse up the graph to find the Object node
      let currentId: string | undefined = nodeId
      while (currentId) {
        const incomingEdge = edges.find((e) => e.target === currentId)
        if (!incomingEdge) break

        const parentNode = nodes.find((n) => n.id === incomingEdge.source)
        if (!parentNode) break

        const parentData = parentNode.data as FlowNodeData
        if (parentData.nodeType === 'object') {
          // Found Object node - build target from its classes
          if (parentData.classes && parentData.classes.length > 0) {
            return {
              label: parentData.classes[0],
              classType: parentData.classifiers && parentData.classifiers.length > 0 ? 'classifier' : null,
              resultLabel: parentData.classifiers && parentData.classifiers.length > 0 ? parentData.classifiers : null,
            }
          }
          return undefined
        }
        currentId = incomingEdge.source
      }
      return undefined
    }

    // Build configs from nodes
    const configs = nodes.map((node) => {
      const data = node.data as FlowNodeData
      const eventType = mapNodeTypeToEventType(data.nodeType)

      // Skip nodes without valid event types
      if (!eventType) return null

      // Find parent node (source of incoming edge)
      // Skip parentId if parent is filtered out (e.g., Object node)
      const incomingEdge = edges.find((e) => e.target === node.id)
      let parentId: string | undefined
      if (incomingEdge) {
        const parentNode = nodes.find((n) => n.id === incomingEdge.source)
        if (parentNode) {
          const parentData = parentNode.data as FlowNodeData
          const parentEventType = mapNodeTypeToEventType(parentData.nodeType)
          // Only include parentId if parent node will be in the final configs
          if (parentEventType) {
            parentId = incomingEdge.source
          }
        }
      }

      // For Zone/Line nodes, get target from parent Object node
      let target: { label: string; classType: string | null; resultLabel: string[] | null } | undefined
      if (['zone', 'line'].includes(data.nodeType)) {
        target = findParentObjectTarget(node.id)
      }

      return {
        eventType,
        eventSettingId: node.id,
        eventSettingName: data.label,
        parentId,
        points: data.points,
        target,
        direction: data.direction,
        ncond: data.ncond,
        timeout: data.timeout,
        ext: data.ext,
      }
    })

    return {
      version: SETTINGS_VERSION,
      configs: configs.filter((c) => c !== null) as any,
    }
  }, [nodes, edges])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (settings: InferenceSettings) => {
      if (!app?.id) throw new Error('No app selected')
      return inferenceApi.updateEventSettings(app.id, cameraId, settings)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inferences'] })
      console.log('Event settings saved:', data)
      if (data.nats_success) {
        alert('Settings saved successfully!')
      } else {
        alert(`Settings saved but compositor failed: ${data.nats_message}`)
      }
    },
    onError: (error) => {
      console.error('Failed to save event settings:', error)
      alert('Failed to save settings')
    },
  })

  // Get selected node
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null

  // Map flow node type to API event type (for preview geometry)
  const nodeTypeToEventType = (nodeType: FlowNodeType): EventType | null => {
    const mapping: Record<FlowNodeType, EventType | null> = {
      object: null, // Object doesn't have geometry
      zone: 'RoI',  // Case sensitive!
      line: 'Line',
      event: null,
      count: null,
      timeout: null,
      speed: null,
      merge: null,
      alarm: null,
    }
    return mapping[nodeType]
  }

  // Get nodes with geometry for preview as EventSetting[]
  const geometryEvents: EventSetting[] = useMemo(() => {
    return nodes
      .filter((n) => {
        const data = n.data as FlowNodeData
        return data.points && ['zone', 'line'].includes(data.nodeType)
      })
      .map((n) => {
        const data = n.data as FlowNodeData
        return {
          eventSettingId: n.id,
          eventSettingName: data.label,
          eventType: nodeTypeToEventType(data.nodeType) || 'RoI',
          points: data.points,
          direction: data.direction,
        } as EventSetting
      })
  }, [nodes])

  // Handlers
  const handleNodesChange = useCallback((newNodes: Node[]) => {
    setNodes(newNodes)
  }, [])

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges)
  }, [])

  const handleUpdateNode = useCallback((nodeId: string, data: Partial<FlowNodeData>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
    )
  }, [])

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId))
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId))
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
    }
  }, [selectedNodeId])

  const handleUpdatePoints = useCallback((nodeId: string, points: [number, number][]) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, points } } : n))
    )
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const settings = convertToApiFormat()
      await updateMutation.mutateAsync(settings)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Reset all changes? This will clear all nodes.')) {
      setNodes([])
      setEdges([])
      setSelectedNodeId(null)
    }
  }

  const handleApplyTemplate = useCallback((templateNodes: Node[], templateEdges: Edge[]) => {
    // Calculate offset to avoid overlapping with existing nodes
    let offsetX = 0
    if (nodes.length > 0) {
      const maxX = Math.max(...nodes.map(n => n.position.x))
      offsetX = maxX + 250 // Add some spacing
    }

    // Apply offset to template nodes
    const offsetNodes = templateNodes.map(node => ({
      ...node,
      position: {
        x: node.position.x + offsetX,
        y: node.position.y,
      },
    }))

    // Append to existing nodes and edges
    setNodes(prev => [...prev, ...offsetNodes])
    setEdges(prev => [...prev, ...templateEdges])
    setSelectedNodeId(null)
  }, [nodes])

  if (!isOpen || !app) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Event Settings</h2>
            <p className="text-sm text-muted-foreground">
              {app.name} on {cameraName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsTemplateModalOpen(true)}
              disabled={isSaving}
            >
              <LayoutTemplate className="h-4 w-4 mr-1" />
              Add Template
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top: Flow Editor + Properties */}
          <div className="flex-1 flex min-h-0">
            {/* Flow Editor (Toolbox + Canvas) */}
            <div className="flex-1 min-w-0">
              <FlowEditor
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onSelectNode={setSelectedNodeId}
                selectedNodeId={selectedNodeId}
              />
            </div>

            {/* Right: Properties */}
            <div className="w-72 border-l shrink-0">
              <NodeProperties
                node={selectedNode}
                onUpdate={handleUpdateNode}
                onDelete={handleDeleteNode}
                appOutputs={appDetails?.outputs}
              />
            </div>
          </div>

          {/* Bottom: Preview Panel (collapsible) */}
          <div className="border-t shrink-0">
            <button
              className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted/50"
              onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
            >
              <span>Video Preview</span>
              {isPreviewExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>

            {isPreviewExpanded && (
              <div className="p-4 pt-0">
                {isLoading ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    Loading preview...
                  </div>
                ) : previewUrl ? (
                  <div className="flex justify-center">
                    <EventCanvas
                      imageUrl={previewUrl}
                      events={geometryEvents}
                      selectedId={selectedNodeId}
                      onUpdatePoints={handleUpdatePoints}
                      width={640}
                      height={360}
                    />
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No preview available
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
          <span>
            {nodes.length} nodes, {edges.length} connections
          </span>
          <span>
            Drag to select · Space+Drag to pan · Del to delete
          </span>
        </div>
      </div>

      {/* Template Modal */}
      <FlowTemplatesModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleApplyTemplate}
      />
    </div>
  )
}

// Helper function to map node type to API event type
// Valid compositor types: RoI, Line, And, Or, Speed, Heatmap, Filter, Enter-Exit, Alarm
function mapNodeTypeToEventType(nodeType: string): string | null {
  const mapping: Record<string, string | null> = {
    object: null,      // Object provides target info, not sent as separate config
    zone: 'RoI',       // Case sensitive!
    line: 'Line',
    event: null,       // Internal processing node
    count: 'Filter',   // Count condition maps to Filter
    timeout: 'Filter', // Timeout condition maps to Filter
    speed: 'Speed',
    merge: 'And',      // Merge maps to logical And
    alarm: 'Alarm',
  }
  return mapping[nodeType] ?? null
}

// Re-export types
export type { FlowNodeData, FlowNodeType } from './CustomNodes'
