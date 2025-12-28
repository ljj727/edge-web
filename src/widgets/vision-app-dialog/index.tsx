import { useState } from 'react'
import { Button } from '@shared/ui'
import { X, Package, Check, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { useApps } from '@features/app'
import type { App } from '@shared/types'

interface AssignVisionAppDialogProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (app: App) => void
  assignedAppIds?: string[]
}

export function AssignVisionAppDialog({
  isOpen,
  onClose,
  onAssign,
  assignedAppIds = [],
}: AssignVisionAppDialogProps) {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const { data: apps, isLoading } = useApps()

  if (!isOpen) return null

  const availableApps = (apps || []).filter(
    (app) => !assignedAppIds.includes(app.id)
  )

  const handleAssign = () => {
    const app = apps?.find((a) => a.id === selectedAppId)
    if (app) {
      onAssign(app)
      setSelectedAppId(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Assign Vision App</h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Available Apps List */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Available Vision Apps
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableApps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {apps?.length === 0
                  ? 'No Vision Apps registered. Please upload apps in the Vision Apps page.'
                  : 'All apps are already assigned to this camera.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-auto">
                {availableApps.map((app) => (
                  <div
                    key={app.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedAppId === app.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => setSelectedAppId(app.id)}
                  >
                    <div className="flex items-center gap-3">
                      {selectedAppId === app.id && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{app.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.version}
                        </p>
                        {app.desc && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {app.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedAppId}>
            Assign App
          </Button>
        </div>
      </div>
    </div>
  )
}
