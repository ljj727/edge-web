import { useState, useEffect } from 'react'
import { Button } from '@shared/ui'
import { X, Settings } from 'lucide-react'
import { useCameraStore, type CameraDisplaySettings, defaultDisplaySettings } from '@features/camera'
import type { Camera } from '@shared/types'

interface CameraSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  camera: Camera | null
}

export function CameraSettingsDialog({
  isOpen,
  onClose,
  camera,
}: CameraSettingsDialogProps) {
  const getDisplaySettings = useCameraStore((state) => state.getDisplaySettings)
  const setDisplaySettings = useCameraStore((state) => state.setDisplaySettings)

  const [settings, setSettings] = useState<CameraDisplaySettings>(defaultDisplaySettings)

  // Load settings when camera changes
  useEffect(() => {
    if (camera) {
      setSettings(getDisplaySettings(camera.id))
    }
  }, [camera, getDisplaySettings])

  const handleToggle = (key: keyof CameraDisplaySettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    if (camera) {
      setDisplaySettings(camera.id, settings)
    }
    onClose()
  }

  const handleCancel = () => {
    // Reset to stored settings
    if (camera) {
      setSettings(getDisplaySettings(camera.id))
    }
    onClose()
  }

  if (!isOpen || !camera) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <div>
              <h2 className="text-lg font-semibold">Camera Settings</h2>
              <p className="text-sm text-muted-foreground">{camera.name}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Detection Overlay Section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Detection Overlay</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Show Bounding Box</span>
                <input
                  type="checkbox"
                  checked={settings.showBoundingBox}
                  onChange={() => handleToggle('showBoundingBox')}
                  className="w-4 h-4 rounded border-gray-300"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Show Label</span>
                <input
                  type="checkbox"
                  checked={settings.showLabel}
                  onChange={() => handleToggle('showLabel')}
                  className="w-4 h-4 rounded border-gray-300"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Show Track ID</span>
                <input
                  type="checkbox"
                  checked={settings.showTrackId}
                  onChange={() => handleToggle('showTrackId')}
                  className="w-4 h-4 rounded border-gray-300"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Show Detection Score</span>
                <input
                  type="checkbox"
                  checked={settings.showScore}
                  onChange={() => handleToggle('showScore')}
                  className="w-4 h-4 rounded border-gray-300"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  )
}
