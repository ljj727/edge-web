import { useState } from 'react'
import { Video } from 'lucide-react'
import { CameraView } from '@widgets/camera-view'
import { cn } from '@shared/lib/cn'
import { useCameraStore } from '@features/camera'
import type { Camera } from '@shared/types'

interface CameraGridProps {
  cameras: Camera[]
  selectedCameraIds: string[]
  onRemoveCamera?: (id: string) => void
  onCameraSettings?: (id: string) => void
  className?: string
}

export function CameraGrid({
  cameras,
  selectedCameraIds,
  onRemoveCamera,
  onCameraSettings,
  className,
}: CameraGridProps) {
  const [maximizedId, setMaximizedId] = useState<string | null>(null)
  const getDisplaySettings = useCameraStore((state) => state.getDisplaySettings)

  // Get selected cameras in order
  const selectedCameras = selectedCameraIds
    .map((id) => cameras.find((c) => c.id === id))
    .filter((c): c is Camera => c !== undefined)

  // Determine grid layout based on camera count
  // 1-2 cameras: vertical stack (1 column) for better 16:9 utilization
  // 3+ cameras: grid layout
  const getGridClass = (count: number) => {
    if (count <= 2) return 'grid-cols-1'
    if (count <= 4) return 'grid-cols-2'
    if (count <= 6) return 'grid-cols-3'
    return 'grid-cols-4'
  }

  const handleMaximize = (id: string) => {
    setMaximizedId(maximizedId === id ? null : id)
  }

  const handleRemove = (id: string) => {
    if (maximizedId === id) {
      setMaximizedId(null)
    }
    onRemoveCamera?.(id)
  }

  // If a camera is maximized, show only that one
  if (maximizedId) {
    const maximizedCamera = selectedCameras.find((c) => c.id === maximizedId)
    if (maximizedCamera) {
      return (
        <div className={cn('h-full p-2 bg-gray-900 flex items-center justify-center', className)}>
          <CameraView
            camera={maximizedCamera}
            onRemove={handleRemove}
            onMaximize={handleMaximize}
            onSettings={onCameraSettings}
            displaySettings={getDisplaySettings(maximizedCamera.id)}
            className="aspect-video max-h-full max-w-full"
          />
        </div>
      )
    }
  }

  return (
    <div className={cn('h-full p-2 bg-gray-900', className)}>
      {selectedCameras.length === 0 ? (
        // Empty state
        <div className="h-full flex flex-col items-center justify-center text-gray-500">
          <Video className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium mb-2">No Cameras Selected</p>
          <p className="text-sm">Select cameras from the left panel</p>
        </div>
      ) : (
        // Camera grid
        <div
          className={cn(
            'grid gap-2 h-full place-content-center',
            getGridClass(selectedCameras.length)
          )}
        >
          {selectedCameras.map((camera) => (
            <CameraView
              key={camera.id}
              camera={camera}
              onRemove={handleRemove}
              onMaximize={handleMaximize}
              onSettings={onCameraSettings}
              displaySettings={getDisplaySettings(camera.id)}
              className="aspect-video"
            />
          ))}
        </div>
      )}
    </div>
  )
}
