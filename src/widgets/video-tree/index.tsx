import { useState } from 'react'
import { ChevronRight, ChevronDown, Server, HardDrive, Video } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { MxServer, Stream } from '@shared/types'

interface VideoTreeProps {
  servers: MxServer[]
  streams: Stream[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function VideoTree({
  servers,
  streams,
  selectedId,
  onSelect,
}: VideoTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Build tree structure
  const treeData = servers.map((server) => ({
    ...server,
    devices: server.devices.map((device) => ({
      ...device,
      streams: streams.filter((s) => s.deviceId === device.id),
    })),
  }))

  return (
    <div className="space-y-1">
      {treeData.map((server) => (
        <TreeNode
          key={server.id}
          id={server.id}
          label={server.name}
          icon={Server}
          isExpanded={expandedNodes.has(server.id)}
          onToggle={() => toggleNode(server.id)}
          status={server.status}
        >
          {server.devices.map((device) => (
            <TreeNode
              key={device.id}
              id={device.id}
              label={device.name}
              icon={HardDrive}
              isExpanded={expandedNodes.has(device.id)}
              onToggle={() => toggleNode(device.id)}
              indent={1}
            >
              {device.streams.map((stream) => (
                <TreeNode
                  key={stream.id}
                  id={stream.id}
                  label={stream.name}
                  icon={Video}
                  isSelected={selectedId === stream.id}
                  onClick={() => onSelect(stream.id)}
                  indent={2}
                  isLeaf
                />
              ))}
            </TreeNode>
          ))}
        </TreeNode>
      ))}

      {/* Streams without server */}
      {streams
        .filter((s) => !s.serverId)
        .map((stream) => (
          <TreeNode
            key={stream.id}
            id={stream.id}
            label={stream.name}
            icon={Video}
            isSelected={selectedId === stream.id}
            onClick={() => onSelect(stream.id)}
            isLeaf
          />
        ))}
    </div>
  )
}

interface TreeNodeProps {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isExpanded?: boolean
  isSelected?: boolean
  isLeaf?: boolean
  indent?: number
  status?: 'online' | 'offline'
  onToggle?: () => void
  onClick?: () => void
  children?: React.ReactNode
}

function TreeNode({
  label,
  icon: Icon,
  isExpanded,
  isSelected,
  isLeaf,
  indent = 0,
  status,
  onToggle,
  onClick,
  children,
}: TreeNodeProps) {
  const hasChildren = !isLeaf && children

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors',
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent hover:text-accent-foreground'
        )}
        style={{ paddingLeft: `${indent * 16 + 8}px` }}
        onClick={() => {
          if (hasChildren && onToggle) {
            onToggle()
          }
          if (onClick) {
            onClick()
          }
        }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )
        ) : (
          <span className="w-4" />
        )}
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate flex-1">{label}</span>
        {status && (
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              status === 'online' ? 'bg-green-500' : 'bg-red-500'
            )}
          />
        )}
      </div>
      {hasChildren && isExpanded && <div>{children}</div>}
    </div>
  )
}
