import { useState } from 'react'
import { Button } from '@shared/ui'
import { X, Timer, Bell, Hash, ChevronRight, Square, ArrowRight } from 'lucide-react'
import type { Node, Edge } from '@xyflow/react'
import type { FlowNodeData } from './CustomNodes'

type AreaType = 'zone' | 'line'

interface FlowTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  supportsAreaChoice: boolean
  buildNodes: (areaType: AreaType) => Omit<Node, 'id'>[]
  buildEdges: (nodeCount: number) => { sourceIndex: number; targetIndex: number }[]
}

const NODE_SPACING = 120 // Vertical spacing between nodes

const getAreaNode = (areaType: AreaType, index: number): Omit<Node, 'id'> => {
  if (areaType === 'zone') {
    return {
      type: 'custom',
      position: { x: 100, y: index * NODE_SPACING },
      data: {
        label: 'Zone#1',
        nodeType: 'zone',
        points: [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8]],
      } as FlowNodeData,
    }
  }
  return {
    type: 'custom',
    position: { x: 100, y: index * NODE_SPACING },
    data: {
      label: 'Line#1',
      nodeType: 'line',
      points: [[0.3, 0.5], [0.7, 0.5]],
      direction: 'BOTH',
    } as FlowNodeData,
  }
}

const TEMPLATES: FlowTemplate[] = [
  {
    id: 'basic',
    name: 'Basic Detection',
    description: 'Object → Area → Event → Alarm',
    icon: <ChevronRight className="h-5 w-5" />,
    supportsAreaChoice: true,
    buildNodes: (areaType) => [
      { type: 'custom', position: { x: 100, y: 0 }, data: { label: 'Object#1', nodeType: 'object', classes: [] } as FlowNodeData },
      getAreaNode(areaType, 1),
      { type: 'custom', position: { x: 100, y: NODE_SPACING * 2 }, data: { label: 'Event#1', nodeType: 'event' } as FlowNodeData },
      { type: 'custom', position: { x: 100, y: NODE_SPACING * 3 }, data: { label: 'Alarm#1', nodeType: 'alarm', alarmType: 'notification', ext: '' } as FlowNodeData },
    ],
    buildEdges: () => [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 2, targetIndex: 3 },
    ],
  },
  {
    id: 'with-timeout',
    name: 'With Timeout',
    description: 'Object → Area → Timeout → Event → Alarm',
    icon: <Timer className="h-5 w-5" />,
    supportsAreaChoice: true,
    buildNodes: (areaType) => [
      { type: 'custom', position: { x: 100, y: 0 }, data: { label: 'Object#1', nodeType: 'object', classes: [] } as FlowNodeData },
      getAreaNode(areaType, 1),
      { type: 'custom', position: { x: 100, y: NODE_SPACING * 2 }, data: { label: 'Timeout#1', nodeType: 'timeout', timeout: 5 } as FlowNodeData },
      { type: 'custom', position: { x: 100, y: NODE_SPACING * 3 }, data: { label: 'Event#1', nodeType: 'event' } as FlowNodeData },
      { type: 'custom', position: { x: 100, y: NODE_SPACING * 4 }, data: { label: 'Alarm#1', nodeType: 'alarm', alarmType: 'notification', ext: '' } as FlowNodeData },
    ],
    buildEdges: () => [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 2, targetIndex: 3 },
      { sourceIndex: 3, targetIndex: 4 },
    ],
  },
  {
    id: 'with-count',
    name: 'With Count',
    description: 'Object → Area → Count → Event → Alarm',
    icon: <Hash className="h-5 w-5" />,
    supportsAreaChoice: true,
    buildNodes: (areaType) => [
      { type: 'custom', position: { x: 100, y: 0 }, data: { label: 'Object#1', nodeType: 'object', classes: [] } as FlowNodeData },
      getAreaNode(areaType, 1),
      { type: 'custom', position: { x: 100, y: NODE_SPACING * 2 }, data: { label: 'Count#1', nodeType: 'count', ncond: '>=3' } as FlowNodeData },
      { type: 'custom', position: { x: 100, y: NODE_SPACING * 3 }, data: { label: 'Event#1', nodeType: 'event' } as FlowNodeData },
      { type: 'custom', position: { x: 100, y: NODE_SPACING * 4 }, data: { label: 'Alarm#1', nodeType: 'alarm', alarmType: 'notification', ext: '' } as FlowNodeData },
    ],
    buildEdges: () => [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 2, targetIndex: 3 },
      { sourceIndex: 3, targetIndex: 4 },
    ],
  },
  {
    id: 'multi-alarm',
    name: 'Multi Alarm',
    description: 'Object → Area → Event → Multiple Alarms',
    icon: <Bell className="h-5 w-5" />,
    supportsAreaChoice: true,
    buildNodes: (areaType) => [
      { type: 'custom', position: { x: 150, y: 0 }, data: { label: 'Object#1', nodeType: 'object', classes: [] } as FlowNodeData },
      { ...getAreaNode(areaType, 1), position: { x: 150, y: NODE_SPACING } },
      { type: 'custom', position: { x: 150, y: NODE_SPACING * 2 }, data: { label: 'Event#1', nodeType: 'event' } as FlowNodeData },
      { type: 'custom', position: { x: 50, y: NODE_SPACING * 3 }, data: { label: 'Alarm#1', nodeType: 'alarm', alarmType: 'notification', ext: '' } as FlowNodeData },
      { type: 'custom', position: { x: 250, y: NODE_SPACING * 3 }, data: { label: 'Alarm#2', nodeType: 'alarm', alarmType: 'recording', ext: '' } as FlowNodeData },
    ],
    buildEdges: () => [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 2, targetIndex: 3 },
      { sourceIndex: 2, targetIndex: 4 },
    ],
  },
]

interface FlowTemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (nodes: Node[], edges: Edge[]) => void
}

function generateId() {
  // Generate UUID format required by NATS compositor
  return crypto.randomUUID()
}

export function FlowTemplatesModal({ isOpen, onClose, onSelectTemplate }: FlowTemplatesModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(null)

  if (!isOpen) return null

  const handleSelectTemplate = (template: FlowTemplate) => {
    if (template.supportsAreaChoice) {
      setSelectedTemplate(template)
    } else {
      applyTemplate(template, 'zone')
    }
  }

  const handleSelectArea = (areaType: AreaType) => {
    if (selectedTemplate) {
      applyTemplate(selectedTemplate, areaType)
    }
  }

  const applyTemplate = (template: FlowTemplate, areaType: AreaType) => {
    const templateNodes = template.buildNodes(areaType)
    const nodeIds = templateNodes.map(() => generateId())

    const nodes: Node[] = templateNodes.map((node, index) => ({
      ...node,
      id: nodeIds[index],
    }))

    const templateEdges = template.buildEdges(templateNodes.length)
    const edges: Edge[] = templateEdges.map((edge, index) => ({
      id: `edge_${Date.now()}_${index}`,
      source: nodeIds[edge.sourceIndex],
      target: nodeIds[edge.targetIndex],
      type: 'deletable',
      animated: true,
      style: { stroke: '#888', strokeWidth: 2 },
    }))

    onSelectTemplate(nodes, edges)
    setSelectedTemplate(null)
    onClose()
  }

  const handleBack = () => {
    setSelectedTemplate(null)
  }

  const handleClose = () => {
    setSelectedTemplate(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">
              {selectedTemplate ? 'Select Area Type' : 'Add Flow Template'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedTemplate ? selectedTemplate.name : 'Select a template to add'}
            </p>
          </div>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {selectedTemplate ? (
            // Area Type Selection
            <div className="space-y-3">
              <button
                onClick={handleBack}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                ← Back to templates
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSelectArea('zone')}
                  className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-center"
                >
                  <div className="flex justify-center mb-2">
                    <div className="p-3 rounded-md bg-purple-500/10 text-purple-500">
                      <Square className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="font-medium">Zone</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Polygon area detection
                  </div>
                </button>
                <button
                  onClick={() => handleSelectArea('line')}
                  className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-center"
                >
                  <div className="flex justify-center mb-2">
                    <div className="p-3 rounded-md bg-green-500/10 text-green-500">
                      <ArrowRight className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="font-medium">Line</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Line crossing detection
                  </div>
                </button>
              </div>
            </div>
          ) : (
            // Template Selection
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="w-full p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left flex items-start gap-3"
                >
                  <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {template.description.replace('Area', 'Zone/Line')}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-center" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Template will be added to existing flow. You can add multiple templates.
          </p>
        </div>
      </div>
    </div>
  )
}
