import type { DragEvent } from 'react'
import { Box, CircleDot, GitBranch, Timer, Hash, Gauge, GitMerge, Bell } from 'lucide-react'
import type { FlowNodeType } from './CustomNodes'

interface ToolboxProps {
  onDragStart: (event: DragEvent, nodeType: FlowNodeType) => void
}

const TOOLS: { type: FlowNodeType; icon: React.ElementType; label: string; description: string }[] = [
  { type: 'object', icon: Box, label: 'Object', description: 'Select detection classes' },
  { type: 'zone', icon: CircleDot, label: 'Zone', description: 'ROI polygon area' },
  { type: 'line', icon: GitBranch, label: 'Line', description: 'Crossing line' },
  { type: 'event', icon: CircleDot, label: 'Event', description: 'Trigger event' },
  { type: 'count', icon: Hash, label: 'Count', description: 'Count condition' },
  { type: 'timeout', icon: Timer, label: 'Timeout', description: 'Time delay' },
  { type: 'speed', icon: Gauge, label: 'Speed', description: 'Speed measurement' },
  { type: 'merge', icon: GitMerge, label: 'Merge', description: 'Combine events' },
  { type: 'alarm', icon: Bell, label: 'Alarm', description: 'Send notification' },
]

export function Toolbox({ onDragStart }: ToolboxProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <h3 className="text-sm font-medium">Toolbox</h3>
        <p className="text-xs text-muted-foreground mt-1">Drag to add nodes</p>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <div
                key={tool.type}
                draggable
                onDragStart={(e) => onDragStart(e, tool.type)}
                className="flex items-center gap-3 p-2.5 rounded-lg border bg-card cursor-grab hover:bg-muted/50 active:cursor-grabbing transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{tool.label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {tool.description}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
