import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@shared/lib/cn'

// Node type definitions
export type FlowNodeType = 'object' | 'zone' | 'line' | 'event' | 'count' | 'timeout' | 'speed' | 'merge' | 'alarm'

// Alarm sensor configuration (stored in ext as JSON array)
export interface AlarmSensorConfig {
  id: string // sensor ID to trigger
  typeId: string // sensor type ID
  alarmType: string // e.g., "LED", "BUZZER", "DO"
  alarmValue: string // e.g., "RED", "GREEN", "1"
  duration: number // seconds
  priority?: number
}

export interface FlowNodeData extends Record<string, unknown> {
  label: string
  nodeType: FlowNodeType
  // Object node
  classes?: string[]
  classifiers?: string[]
  // Zone/Line node
  points?: [number, number][]
  direction?: 'A2B' | 'B2A' | 'BOTH'
  // Event node
  eventType?: string
  // Count node
  ncond?: string
  // Timeout node
  timeout?: number
  // Alarm node
  alarmType?: string
  ext?: string
  alarmSensors?: AlarmSensorConfig[] // parsed from ext for UI
  // Validation
  warning?: string
}

const NODE_COLORS: Record<FlowNodeType, { border: string; bg: string }> = {
  object: { border: '#3b82f6', bg: '#3b82f620' },
  zone: { border: '#a855f7', bg: '#a855f720' },
  line: { border: '#22c55e', bg: '#22c55e20' },
  event: { border: '#22c55e', bg: '#22c55e20' },
  count: { border: '#f97316', bg: '#f9731620' },
  timeout: { border: '#eab308', bg: '#eab30820' },
  speed: { border: '#ec4899', bg: '#ec489920' },
  merge: { border: '#6366f1', bg: '#6366f120' },
  alarm: { border: '#ef4444', bg: '#ef444420' },
}

const NODE_LABELS: Record<FlowNodeType, string> = {
  object: 'Object',
  zone: 'Zone',
  line: 'Line',
  event: 'Event',
  count: 'Count',
  timeout: 'Timeout',
  speed: 'Speed',
  merge: 'Merge',
  alarm: 'Alarm',
}

function CustomNodeBase({ data, selected }: NodeProps) {
  const nodeData = data as FlowNodeData
  const colors = NODE_COLORS[nodeData.nodeType]
  const typeLabel = NODE_LABELS[nodeData.nodeType]

  return (
    <div
      className={cn(
        'min-w-[140px] rounded-md border-2 bg-background shadow-sm transition-shadow',
        selected && 'ring-[3px] ring-primary shadow-xl shadow-primary/20'
      )}
      style={{ borderColor: colors.border }}
    >
      {/* Input Handle (top) */}
      {nodeData.nodeType !== 'object' && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-background"
        />
      )}

      {/* Header */}
      <div
        className="px-3 py-1.5 text-xs font-medium border-b flex items-center justify-between"
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      >
        <span>{typeLabel}</span>
        {nodeData.warning && (
          <span className="group relative">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-popover border rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {nodeData.warning}
            </span>
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        <div className="text-sm font-medium truncate">{nodeData.label}</div>

        {/* Object: Show classes and classifiers */}
        {nodeData.nodeType === 'object' && (
          <div className="mt-1 space-y-1">
            {nodeData.classes && nodeData.classes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {nodeData.classes.map((cls: string) => (
                  <span
                    key={cls}
                    className="px-1.5 py-0.5 text-xs rounded"
                    style={{ backgroundColor: colors.bg, color: colors.border }}
                  >
                    {cls}
                  </span>
                ))}
              </div>
            )}
            {nodeData.classifiers && nodeData.classifiers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {nodeData.classifiers.map((cls: string) => (
                  <span
                    key={cls}
                    className="px-1.5 py-0.5 text-xs rounded border"
                    style={{ borderColor: colors.border, color: colors.border }}
                  >
                    {cls}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Zone/Line: Show point count */}
        {(nodeData.nodeType === 'zone' || nodeData.nodeType === 'line') && nodeData.points && (
          <div className="text-xs text-muted-foreground mt-1">
            {nodeData.points.length} points
          </div>
        )}

        {/* Count: Show condition */}
        {nodeData.nodeType === 'count' && nodeData.ncond && (
          <div className="text-xs text-muted-foreground mt-1">
            n {nodeData.ncond}
          </div>
        )}

        {/* Timeout: Show duration */}
        {nodeData.nodeType === 'timeout' && nodeData.timeout && (
          <div className="text-xs text-muted-foreground mt-1">
            {nodeData.timeout}s
          </div>
        )}
      </div>

      {/* Output Handle (bottom) */}
      {nodeData.nodeType !== 'alarm' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-background"
        />
      )}
    </div>
  )
}

export const CustomNode = memo(CustomNodeBase)

// Default data for each node type
export function getDefaultNodeData(nodeType: FlowNodeType): FlowNodeData {
  const base = {
    label: `${NODE_LABELS[nodeType]}#1`,
    nodeType,
  }

  switch (nodeType) {
    case 'object':
      return { ...base, classes: [] }
    case 'zone':
      return { ...base, points: [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8]] }
    case 'line':
      return { ...base, points: [[0.3, 0.5], [0.7, 0.5]], direction: 'BOTH' }
    case 'count':
      return { ...base, ncond: '>=1' }
    case 'timeout':
      return { ...base, timeout: 5 }
    case 'alarm':
      return { ...base, alarmSensors: [], ext: '[]' }
    default:
      return base
  }
}
