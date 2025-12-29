import { Button } from '@shared/ui'
import { Plus, X, FileText, Settings, Video } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { Camera } from '@shared/types'

import type { App, AppOutput } from '@shared/types'

// Vision App with runtime status
export interface VisionApp extends Pick<App, 'id' | 'name' | 'version'> {
  status: 'connected' | 'disconnected' | 'error'
  outputs?: AppOutput[]
}

export type { AppOutput }

interface VisionAppPanelProps {
  camera: Camera | null
  assignedApps?: VisionApp[]
  onAssignApp?: () => void
  onRemoveApp?: (appId: string) => void
  onConfigureEvents?: (appId: string) => void
  onCameraSettings?: () => void
  className?: string
}

export function VisionAppPanel({
  camera,
  assignedApps = [],
  onAssignApp,
  onRemoveApp,
  onConfigureEvents,
  onCameraSettings,
  className,
}: VisionAppPanelProps) {
  if (!camera) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        <p>Select a camera to manage Vision Apps</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold truncate">{camera.name}</h2>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={onCameraSettings}
              title="Camera Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onAssignApp}
            className="shrink-0"
          >
            <Plus className="mr-1 h-4 w-4" />
            Assign Vision App
          </Button>
        </div>
      </div>

      {/* Assigned Apps List */}
      <div className="flex-1 overflow-auto p-4">
        {assignedApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Video className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm font-medium">No Vision Apps Assigned</p>
            <p className="text-xs mt-1">
              Click "Assign Vision App" to add AI inference to this stream
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedApps.map((app) => (
              <div
                key={app.id}
                className="p-3 rounded-lg border bg-card"
              >
                {/* Main row: name + events icon */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onRemoveApp?.(app.id)
                    }}
                    title="Remove App"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0 flex items-center gap-1">
                    <span className="font-medium truncate">
                      {app.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      v{app.version}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={() => onConfigureEvents?.(app.id)}
                    title="Event Settings"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status badge */}
                <div className="mt-2 pl-8">
                  <StatusBadge status={app.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: VisionApp['status'] }) {
  const statusConfig = {
    connected: {
      label: 'Connected',
      className: 'bg-green-500/10 text-green-500 border-green-500/20',
    },
    disconnected: {
      label: 'Disconnected',
      className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    },
    error: {
      label: 'Error',
      className: 'bg-red-500/10 text-red-500 border-red-500/20',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'px-2 py-0.5 text-xs font-medium rounded-full border',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
