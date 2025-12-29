import { Button } from '@shared/ui'
import { Trash2 } from 'lucide-react'
import type { Node } from '@xyflow/react'
import type { FlowNodeData } from './CustomNodes'
import type { AppOutput } from '@widgets/vision-app-panel'

interface NodePropertiesProps {
  node: Node | null
  onUpdate: (nodeId: string, data: Partial<FlowNodeData>) => void
  onDelete: (nodeId: string) => void
  appOutputs?: AppOutput[]
}

export function NodeProperties({ node, onUpdate, onDelete, appOutputs = [] }: NodePropertiesProps) {

  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
        <p className="text-sm">Select a node to view properties</p>
        <p className="text-xs mt-1">or drag from toolbox to add</p>
      </div>
    )
  }

  const data = node.data as FlowNodeData

  const handleUpdate = (updates: Partial<FlowNodeData>) => {
    onUpdate(node.id, updates)
  }

  const toggleClass = (cls: string) => {
    const currentClasses = data.classes || []
    if (currentClasses.includes(cls)) {
      handleUpdate({ classes: currentClasses.filter((c) => c !== cls) })
    } else {
      handleUpdate({ classes: [...currentClasses, cls] })
    }
  }

  const toggleClassifier = (classifier: string) => {
    const currentClassifiers = data.classifiers || []
    if (currentClassifiers.includes(classifier)) {
      handleUpdate({ classifiers: currentClassifiers.filter((c) => c !== classifier) })
    } else {
      handleUpdate({ classifiers: [...currentClassifiers, classifier] })
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Properties</div>
          <div className="text-xs text-muted-foreground capitalize">{data.nodeType}</div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-destructive"
          onClick={() => onDelete(node.id)}
          title="Delete node"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {/* Name */}
        <Section title="Name">
          <input
            type="text"
            value={data.label}
            onChange={(e) => handleUpdate({ label: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border rounded bg-background"
          />
        </Section>

        {/* Object: Class Selection from App Outputs */}
        {data.nodeType === 'object' && (
          <>
            <Section title="Object">
              <div className="flex flex-wrap gap-1.5">
                {appOutputs.length > 0 ? (
                  appOutputs.map((output) => {
                    const isSelected = data.classes?.includes(output.label)
                    return (
                      <button
                        key={output.label}
                        onClick={() => toggleClass(output.label)}
                        className={`px-3 py-1.5 text-sm rounded transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {output.label}
                      </button>
                    )
                  })
                ) : (
                  <span className="text-xs text-muted-foreground">No outputs available</span>
                )}
              </div>
            </Section>

            {/* Show classifiers for selected classes */}
            {appOutputs
              .filter((output) => data.classes?.includes(output.label) && output.classifiers.length > 0)
              .map((output) => (
                <Section key={output.label} title="Classifier">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => {
                        // Clear all classifiers for this output when "None" is selected
                        const toRemove = output.classifiers.filter((c) => data.classifiers?.includes(c))
                        if (toRemove.length > 0) {
                          handleUpdate({
                            classifiers: (data.classifiers || []).filter((c) => !toRemove.includes(c))
                          })
                        }
                      }}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        !output.classifiers.some((c) => data.classifiers?.includes(c))
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      None
                    </button>
                    {output.classifiers.map((classifier) => {
                      const isSelected = data.classifiers?.includes(classifier)
                      return (
                        <button
                          key={classifier}
                          onClick={() => toggleClassifier(classifier)}
                          className={`px-3 py-1.5 text-sm rounded transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {classifier}
                        </button>
                      )
                    })}
                  </div>
                </Section>
              ))}
          </>
        )}

        {/* Zone: Points info */}
        {data.nodeType === 'zone' && (
          <>
            <Section title="Zone Area">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => handleUpdate({
                  points: [[0, 0], [1, 0], [1, 1], [0, 1]] as [number, number][]
                })}
              >
                Set Full Frame
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Cover entire video area
              </p>
            </Section>
            <Section title="Zone Points">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {data.points?.length || 0} points
                </p>
                <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-2 rounded">
                  <p>• <strong>Drag</strong> points to move</p>
                  <p>• <strong>Double-click</strong> edge to add point</p>
                  <p>• <strong>Right-click</strong> point to remove</p>
                  <p className="text-[10px] opacity-70">(minimum 3 points)</p>
                </div>
              </div>
            </Section>
          </>
        )}

        {/* Line: Crossing Direction */}
        {data.nodeType === 'line' && (
          <>
            <Section title="Crossing Direction">
              <select
                value={data.direction || 'BOTH'}
                onChange={(e) => handleUpdate({ direction: e.target.value as FlowNodeData['direction'] })}
                className="w-full px-2 py-1.5 text-sm border rounded bg-background"
              >
                <option value="A2B">A side → B side</option>
                <option value="B2A">B side → A side</option>
                <option value="BOTH">Both directions</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Perpendicular crossing direction
              </p>
            </Section>
            <Section title="Line Points">
              <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-2 rounded">
                <p>• <strong>Drag</strong> A or B to move</p>
                <p>• Line has 2 fixed points (A, B)</p>
              </div>
            </Section>
          </>
        )}

        {/* Count: Condition */}
        {data.nodeType === 'count' && (
          <Section title="Condition">
            <div className="flex items-center gap-2">
              <span className="text-sm">n</span>
              <input
                type="text"
                value={data.ncond || ''}
                onChange={(e) => handleUpdate({ ncond: e.target.value })}
                placeholder=">=1"
                className="flex-1 px-2 py-1.5 text-sm border rounded bg-background"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              e.g. &gt;=1, ==3, &lt;5
            </p>
          </Section>
        )}

        {/* Timeout: Duration */}
        {data.nodeType === 'timeout' && (
          <Section title="Duration">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={data.timeout || ''}
                onChange={(e) => handleUpdate({ timeout: Number(e.target.value) })}
                placeholder="5"
                className="flex-1 px-2 py-1.5 text-sm border rounded bg-background"
              />
              <span className="text-sm text-muted-foreground">seconds</span>
            </div>
          </Section>
        )}

        {/* Alarm: Settings */}
        {data.nodeType === 'alarm' && (
          <>
            <Section title="Alarm Type">
              <select
                value={data.alarmType || 'notification'}
                onChange={(e) => handleUpdate({ alarmType: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border rounded bg-background"
              >
                <option value="notification">Notification</option>
                <option value="email">Email</option>
                <option value="webhook">Webhook</option>
                <option value="recording">Recording</option>
              </select>
            </Section>
            <Section title="Extension Data">
              <textarea
                value={data.ext || ''}
                onChange={(e) => handleUpdate({ ext: e.target.value })}
                placeholder="{}"
                rows={3}
                className="w-full px-2 py-1.5 text-sm border rounded bg-background font-mono"
              />
            </Section>
          </>
        )}

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{title}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
