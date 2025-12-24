import { useState } from 'react'
import { Video, Plus } from 'lucide-react'
import { CameraView } from '@widgets/camera-view'
import { cn } from '@shared/lib/cn'
import type { Camera } from '@shared/types'

interface CameraGridProps {
  cameras: Camera[]
  selectedCameraIds: string[]
  onRemoveCamera?: (id: string) => void
  onAddCamera?: () => void
  className?: string
}

export function CameraGrid({
  cameras,
  selectedCameraIds,
  onRemoveCamera,
  onAddCamera,
  className,
}: CameraGridProps) {
  const [maximizedId, setMaximizedId] = useState<string | null>(null)

  // Get selected cameras in order
  const selectedCameras = selectedCameraIds
    .map((id) => cameras.find((c) => c.id === id))
    .filter((c): c is Camera => c !== undefined)

  // Determine grid layout based on camera count
  const getGridClass = (count: number) => {
    if (count === 0) return 'grid-cols-1'
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
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
        <div className={cn('h-full p-2 bg-gray-900', className)}>
          <CameraView
            camera={maximizedCamera}
            onRemove={handleRemove}
            onMaximize={handleMaximize}
            className="h-full"
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
          <p className="text-sm mb-4">
            Select cameras from the list or add a new camera
          </p>
          {onAddCamera && (
            <button
              onClick={onAddCamera}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Camera
            </button>
          )}
        </div>
      ) : (
        // Camera grid
        <div
          className={cn(
            'grid gap-2 h-full',
            getGridClass(selectedCameras.length)
          )}
        >
          {selectedCameras.map((camera) => (
            <CameraView
              key={camera.id}
              camera={camera}
              onRemove={handleRemove}
              onMaximize={handleMaximize}
              className={cn(
                'aspect-video',
                selectedCameras.length === 1 && 'aspect-auto h-full'
              )}
            />
          ))}

          {/* Add camera placeholder (if less than 4 cameras) */}
          {selectedCameras.length < 4 && onAddCamera && (
            <button
              onClick={onAddCamera}
              className="aspect-video flex flex-col items-center justify-center bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 hover:border-gray-600 hover:bg-gray-700/50 transition-colors"
            >
              <Plus className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-gray-500 text-sm">Add Camera</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
