import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from '@shared/ui'
import { Save, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { inferenceApi, useUpdateEventSettings } from '@features/inference'
import type { GraphData, EventSetting } from '@shared/types'

// This is a placeholder - the actual Rappid integration would go here
// Rappid/JointJS is a commercial library that needs to be installed separately

interface InferenceSettingDialogProps {
  appId: string
  open: boolean
  onClose: () => void
}

export function InferenceSettingDialog({
  appId,
  open,
  onClose,
}: InferenceSettingDialogProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const { data: inferences } = useQuery({
    queryKey: ['inferences'],
    queryFn: inferenceApi.getAll,
  })

  const inference = inferences?.find((i) => i.appId === appId)
  const updateEventSettings = useUpdateEventSettings()

  useEffect(() => {
    if (inference?.nodeSettings) {
      try {
        const parsed = JSON.parse(inference.nodeSettings)
        setGraphData(parsed)
      } catch (e) {
        console.error('Failed to parse node settings:', e)
      }
    }
  }, [inference])

  const handleSave = async () => {
    if (!inference || !graphData) return

    try {
      // Convert graph data to event settings
      const eventSettings = graphDataToEventSettings(graphData)

      await updateEventSettings.mutateAsync({
        appId: inference.appId,
        videoId: inference.videoId,
        settings: {
          version: inference.settings.version,
          configs: eventSettings,
        },
      })

      setHasChanges(false)
      onClose()
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Inference Settings - {inference?.name || 'Loading...'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Left Panel - Canvas/Graph Editor */}
          <div className="flex-1 border rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 border-b p-2 bg-muted/50">
              <Button variant="ghost" size="sm">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <div className="flex-1" />
              <span className="text-xs text-muted-foreground">
                Drag operators from the palette to create your pipeline
              </span>
            </div>

            {/* Canvas Area - Rappid would render here */}
            <div className="h-full bg-[#f8f9fa] relative">
              {/* Placeholder for Rappid canvas */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg font-medium">Graph Editor</p>
                  <p className="text-sm mt-2">
                    Rappid/JointJS canvas will be integrated here
                  </p>
                  <p className="text-xs mt-4 max-w-md">
                    This requires the @clientio/rappid library which is a
                    commercial product. The integration would include:
                  </p>
                  <ul className="text-xs mt-2 text-left inline-block">
                    <li>• Drag-and-drop operator stencil</li>
                    <li>• Visual node connections</li>
                    <li>• Zone/Region drawing on video preview</li>
                    <li>• Parameter editing panels</li>
                    <li>• Graph validation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Operator Palette */}
          <div className="w-64 border rounded-lg overflow-hidden">
            <div className="p-3 border-b bg-muted/50">
              <h3 className="font-medium text-sm">Operators</h3>
            </div>
            <div className="p-2 space-y-1">
              {OPERATORS.map((op) => (
                <div
                  key={op.type}
                  className="flex items-center gap-2 p-2 rounded border bg-white cursor-grab hover:border-primary"
                  draggable
                >
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: op.color }}
                  />
                  <span className="text-sm">{op.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateEventSettings.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {updateEventSettings.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Operator definitions
const OPERATORS = [
  { type: 'Object', label: 'Object Detection', color: '#4CAF50' },
  { type: 'Attribute', label: 'Attribute Filter', color: '#2196F3' },
  { type: 'Zone', label: 'ROI Zone', color: '#FF9800' },
  { type: 'Direction', label: 'Line Crossing', color: '#9C27B0' },
  { type: 'Speed', label: 'Speed Detection', color: '#00BCD4' },
  { type: 'Count', label: 'Count Threshold', color: '#795548' },
  { type: 'Timeout', label: 'Timeout', color: '#607D8B' },
  { type: 'Merge', label: 'AND/OR Merge', color: '#E91E63' },
  { type: 'Event', label: 'Event Trigger', color: '#FF5722' },
  { type: 'Alarm', label: 'Alarm Action', color: '#F44336' },
  { type: 'Sensor', label: 'Sensor Input', color: '#3F51B5' },
]

// Helper function to convert graph data to event settings
function graphDataToEventSettings(graphData: GraphData): EventSetting[] {
  // This would implement the DFS traversal logic from the Angular app
  // to convert the Rappid graph nodes into the EventSetting format
  // that the backend expects

  const eventSettings: EventSetting[] = []

  // Placeholder implementation
  // The actual implementation would traverse the graph nodes
  // and build the event settings hierarchy

  graphData.cells.forEach((cell) => {
    if (cell.type === 'app.Link') return // Skip links

    // Convert node to event setting based on type
    // This is where the complex DFS logic from Angular would go
  })

  return eventSettings
}

