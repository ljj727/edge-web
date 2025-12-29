import { useState } from 'react'
import { Button } from '@shared/ui'
import { X } from 'lucide-react'
import type { EventSetting, DirectionType, DetectionPointType } from '@shared/types'
import { EVENT_TYPE_INFO, DETECTION_POINTS, DIRECTION_OPTIONS, requiresGeometry, isContainerType } from './types'

interface EventPropertiesProps {
  event: EventSetting | null
  onUpdate: (id: string, updates: Partial<EventSetting>) => void
}

// Common labels for object detection
const COMMON_LABELS = ['person', 'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'dog', 'cat']

export function EventProperties({ event, onUpdate }: EventPropertiesProps) {
  const [newLabel, setNewLabel] = useState('')

  if (!event) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
        Select an event to view properties
      </div>
    )
  }

  const info = EVENT_TYPE_INFO[event.eventType]

  const handleUpdate = (updates: Partial<EventSetting>) => {
    onUpdate(event.eventSettingId, updates)
  }

  const handleAddLabel = (label: string) => {
    if (!label.trim()) return
    const currentLabels = event.target?.labels || []
    if (!currentLabels.includes(label)) {
      handleUpdate({
        target: {
          ...event.target,
          labels: [...currentLabels, label],
        },
      })
    }
    setNewLabel('')
  }

  const handleRemoveLabel = (label: string) => {
    const currentLabels = event.target?.labels || []
    handleUpdate({
      target: {
        ...event.target,
        labels: currentLabels.filter((l) => l !== label),
      },
    })
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: info.color + '30', color: info.color }}
          >
            {info.icon}
          </span>
          <span className="font-medium text-sm">{info.label}</span>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* Basic Info */}
        <Section title="Basic">
          <Field label="Name">
            <input
              type="text"
              value={event.eventSettingName}
              onChange={(e) => handleUpdate({ eventSettingName: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border rounded bg-background"
            />
          </Field>
          <Field label="ID">
            <input
              type="text"
              value={event.eventSettingId}
              disabled
              className="w-full px-2 py-1.5 text-sm border rounded bg-muted text-muted-foreground"
            />
          </Field>
        </Section>

        {/* Target - for ROI, Line, EnEx */}
        {['ROI', 'Line', 'EnEx'].includes(event.eventType) && (
          <Section title="Target Labels">
            <div className="flex flex-wrap gap-1 mb-2">
              {(event.target?.labels || []).map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded"
                >
                  {label}
                  <button onClick={() => handleRemoveLabel(label)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1 mb-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel(newLabel)}
                placeholder="Add label..."
                className="flex-1 px-2 py-1 text-sm border rounded bg-background"
              />
              <Button size="sm" onClick={() => handleAddLabel(newLabel)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {COMMON_LABELS.filter((l) => !event.target?.labels?.includes(l)).map((label) => (
                <button
                  key={label}
                  className="px-2 py-0.5 text-xs border rounded hover:bg-muted/50"
                  onClick={() => handleAddLabel(label)}
                >
                  + {label}
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* Detection Point */}
        {requiresGeometry(event.eventType) && event.eventType !== 'Filter' && (
          <Section title="Detection Point">
            <select
              value={event.detectionPoint || 'centerBottom'}
              onChange={(e) => handleUpdate({ detectionPoint: e.target.value as DetectionPointType })}
              className="w-full px-2 py-1.5 text-sm border rounded bg-background"
            >
              {DETECTION_POINTS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Section>
        )}

        {/* Direction - for Line */}
        {event.eventType === 'Line' && (
          <Section title="Direction">
            <select
              value={event.direction || 'BOTH'}
              onChange={(e) => handleUpdate({ direction: e.target.value as DirectionType })}
              className="w-full px-2 py-1.5 text-sm border rounded bg-background"
            >
              {DIRECTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Section>
        )}

        {/* Timeout */}
        {['ROI', 'And'].includes(event.eventType) && (
          <Section title="Timeout (seconds)">
            <input
              type="number"
              value={event.timeout || ''}
              onChange={(e) => handleUpdate({ timeout: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="No timeout"
              className="w-full px-2 py-1.5 text-sm border rounded bg-background"
            />
          </Section>
        )}

        {/* Condition - for And, Or */}
        {isContainerType(event.eventType) && event.eventType !== 'Speed' && (
          <Section title="Condition">
            <Field label="N Condition">
              <input
                type="text"
                value={event.ncond || ''}
                onChange={(e) => handleUpdate({ ncond: e.target.value })}
                placeholder="e.g. >=2, ==3"
                className="w-full px-2 py-1.5 text-sm border rounded bg-background"
              />
            </Field>
            {event.eventType === 'And' && (
              <Field label="In Order">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={event.inOrder || false}
                    onChange={(e) => handleUpdate({ inOrder: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Events must occur in order</span>
                </label>
              </Field>
            )}
          </Section>
        )}

        {/* Heatmap settings */}
        {event.eventType === 'HM' && (
          <Section title="Heatmap Settings">
            <Field label="Regeneration Interval (seconds)">
              <input
                type="number"
                value={event.regenInterval || 60}
                onChange={(e) => handleUpdate({ regenInterval: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-sm border rounded bg-background"
              />
            </Field>
          </Section>
        )}

        {/* Speed settings */}
        {event.eventType === 'Speed' && (
          <Section title="Speed Settings">
            <p className="text-xs text-muted-foreground">
              Add two Line events as children to measure speed between them.
            </p>
          </Section>
        )}

        {/* Alarm settings */}
        {event.eventType === 'Alarm' && (
          <Section title="Alarm Settings">
            <Field label="Extension Data (JSON)">
              <textarea
                value={event.ext || ''}
                onChange={(e) => handleUpdate({ ext: e.target.value })}
                placeholder="{}"
                rows={3}
                className="w-full px-2 py-1.5 text-sm border rounded bg-background font-mono"
              />
            </Field>
          </Section>
        )}

        {/* Geometry info */}
        {requiresGeometry(event.eventType) && event.points && (
          <Section title="Geometry">
            <p className="text-xs text-muted-foreground">
              {event.eventType === 'Line' ? '2 points' : `${event.points.length} points`}
            </p>
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
              {event.points.map((p, i) => (
                <div key={i}>
                  P{i + 1}: ({p[0].toFixed(3)}, {p[1].toFixed(3)})
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground mb-2">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
