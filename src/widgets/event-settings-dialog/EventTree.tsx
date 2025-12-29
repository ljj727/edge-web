import { useState } from 'react'
import { ChevronRight, ChevronDown, Plus, Trash2, Copy } from 'lucide-react'
import { Button } from '@shared/ui'
import { cn } from '@shared/lib/cn'
import type { EventType } from '@shared/types'
import type { EventTreeNode } from './types'
import { EVENT_TYPE_INFO, isContainerType } from './types'

interface EventTreeProps {
  nodes: EventTreeNode[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAdd: (eventType: EventType, parentId?: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onMove: (id: string, newParentId: string | null) => void
}

export function EventTree({
  nodes,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onDuplicate,
}: EventTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showAddMenu, setShowAddMenu] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAddClick = (parentId?: string) => {
    setShowAddMenu(parentId || 'root')
  }

  const handleAddEvent = (eventType: EventType, parentId?: string) => {
    onAdd(eventType, parentId)
    setShowAddMenu(null)
    if (parentId) {
      setExpandedIds((prev) => new Set([...prev, parentId]))
    }
  }

  const renderNode = (node: EventTreeNode, depth: number = 0) => {
    const { config, children } = node
    const info = EVENT_TYPE_INFO[config.eventType]
    const isExpanded = expandedIds.has(config.eventSettingId)
    const isSelected = selectedId === config.eventSettingId
    const hasChildren = children.length > 0
    const canHaveChildren = isContainerType(config.eventType)

    return (
      <div key={config.eventSettingId}>
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer group',
            isSelected ? 'bg-primary/20' : 'hover:bg-muted/50'
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => onSelect(config.eventSettingId)}
        >
          {/* Expand/Collapse */}
          {canHaveChildren ? (
            <button
              className="w-4 h-4 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(config.eventSettingId)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* Icon & Color */}
          <span
            className="w-5 h-5 rounded flex items-center justify-center text-xs"
            style={{ backgroundColor: info.color + '30', color: info.color }}
          >
            {info.icon}
          </span>

          {/* Name */}
          <span className="flex-1 text-sm truncate">{config.eventSettingName}</span>

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
            {canHaveChildren && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddClick(config.eventSettingId)
                }}
                title="Add child"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate(config.eventSettingId)
              }}
              title="Duplicate"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(config.eventSettingId)
              }}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Add Menu */}
        {showAddMenu === config.eventSettingId && (
          <AddEventMenu
            onSelect={(type) => handleAddEvent(type, config.eventSettingId)}
            onClose={() => setShowAddMenu(null)}
            depth={depth + 1}
          />
        )}

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b">
        <span className="text-sm font-medium">Event Tree</span>
        <Button
          size="sm"
          variant="outline"
          className="h-7"
          onClick={() => handleAddClick()}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-2">
        {showAddMenu === 'root' && (
          <AddEventMenu
            onSelect={(type) => handleAddEvent(type)}
            onClose={() => setShowAddMenu(null)}
            depth={0}
          />
        )}
        {nodes.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No events. Click "Add" to create one.
          </div>
        ) : (
          nodes.map((node) => renderNode(node))
        )}
      </div>
    </div>
  )
}

interface AddEventMenuProps {
  onSelect: (type: EventType) => void
  onClose: () => void
  depth: number
}

function AddEventMenu({ onSelect, onClose, depth }: AddEventMenuProps) {
  const eventTypes: EventType[] = ['RoI', 'Line', 'And', 'Or', 'Speed', 'Heatmap', 'Filter', 'Enter-Exit', 'Alarm']

  return (
    <div
      className="bg-popover border rounded-lg shadow-lg p-1 my-1"
      style={{ marginLeft: `${8 + depth * 16}px` }}
    >
      <div className="text-xs text-muted-foreground px-2 py-1">Add Event</div>
      <div className="grid grid-cols-3 gap-1">
        {eventTypes.map((type) => {
          const info = EVENT_TYPE_INFO[type]
          return (
            <button
              key={type}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-muted/50"
              onClick={() => onSelect(type)}
            >
              <span
                className="w-4 h-4 rounded flex items-center justify-center"
                style={{ backgroundColor: info.color + '30', color: info.color }}
              >
                {info.icon}
              </span>
              {info.label}
            </button>
          )
        })}
      </div>
      <button
        className="w-full text-xs text-muted-foreground hover:text-foreground py-1 mt-1 border-t"
        onClick={onClose}
      >
        Cancel
      </button>
    </div>
  )
}
