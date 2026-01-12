import { useState, useRef } from 'react'
import { Video, GripHorizontal } from 'lucide-react'
import { CameraView } from '@widgets/camera-view'
import { cn } from '@shared/lib/cn'
import { useCameraStore } from '@features/camera'
import type { Camera } from '@shared/types'
import type { EventAlert } from '@features/stream'

interface CameraGridProps {
  cameras: Camera[]
  selectedCameraIds: string[]
  onRemoveCamera?: (id: string) => void
  onCameraSettings?: (id: string) => void
  onReorderCameras?: (newOrder: string[]) => void
  onEventTriggered?: (alert: EventAlert) => void
  className?: string
}

export function CameraGrid({
  cameras,
  selectedCameraIds,
  onRemoveCamera,
  onCameraSettings,
  onReorderCameras,
  onEventTriggered,
  className,
}: CameraGridProps) {
  const [maximizedId, setMaximizedId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  // dropIndex: the index where the dragged item will be inserted
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const dropIndexRef = useRef<number | null>(null)
  const getDisplaySettings = useCameraStore((state) => state.getDisplaySettings)

  // Get selected cameras in order
  const selectedCameras = selectedCameraIds
    .map((id) => cameras.find((c) => c.id === id))
    .filter((c): c is Camera => c !== undefined)

  const handleMaximize = (id: string) => {
    setMaximizedId(maximizedId === id ? null : id)
  }

  const handleRemove = (id: string) => {
    if (maximizedId === id) {
      setMaximizedId(null)
    }
    onRemoveCamera?.(id)
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, cameraId: string) => {
    console.log('[Drag] Start:', cameraId)
    setDraggedId(cameraId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', cameraId)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (!draggedId) return

    const draggedIndex = selectedCameraIds.indexOf(draggedId)

    // Don't show indicator if dropping at same position
    if (index === draggedIndex || index === draggedIndex + 1) {
      dropIndexRef.current = null
      setDropIndex(null)
      return
    }

    if (dropIndexRef.current !== index) {
      console.log('[Drag] Over index:', index)
    }
    dropIndexRef.current = index
    setDropIndex(index)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const targetIndex = dropIndexRef.current
    console.log('[Drag] Drop:', { draggedId, targetIndex })

    if (!draggedId || targetIndex === null) {
      console.log('[Drag] Drop cancelled - no draggedId or targetIndex')
      resetDragState()
      return
    }

    const newOrder = [...selectedCameraIds]
    const fromIndex = newOrder.indexOf(draggedId)

    // Remove from original position
    newOrder.splice(fromIndex, 1)

    // Adjust target index if needed (because we removed an item)
    let adjustedIndex = targetIndex
    if (fromIndex < targetIndex) {
      adjustedIndex -= 1
    }

    // Insert at new position
    newOrder.splice(adjustedIndex, 0, draggedId)

    console.log('[Drag] Reorder:', { from: fromIndex, to: adjustedIndex, newOrder })
    onReorderCameras?.(newOrder)
    resetDragState()
  }

  const resetDragState = () => {
    setDraggedId(null)
    setDropIndex(null)
    dropIndexRef.current = null
  }

  const handleDragEnd = () => {
    resetDragState()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving the grid entirely
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropIndex(null)
      dropIndexRef.current = null
    }
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
            onEventTriggered={onEventTriggered}
            displaySettings={getDisplaySettings(maximizedCamera.id)}
            className="max-h-full max-w-full"
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
          <p className="text-sm">Select cameras from above</p>
        </div>
      ) : (
        // Horizontal layout for portrait videos: cam1 | cam2 | cam3 | cam4
        <div
          className="h-full flex flex-row items-stretch justify-center gap-2 px-2"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={handleDragLeave}
        >
          {selectedCameras.map((camera, index) => {
            const isDragging = draggedId === camera.id
            const showIndicator = dropIndex === index
            const showEndIndicator = index === selectedCameras.length - 1 && dropIndex === selectedCameras.length

            return (
              <div
                key={camera.id}
                className={cn(
                  'relative flex-1 max-w-[25%] flex flex-col',
                  isDragging && 'opacity-30'
                )}
              >
                {/* Drop zone - left side (only active during drag) */}
                {draggedId && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1/2 z-40"
                    onDragOver={(e) => handleDragOver(e, index)}
                  />
                )}

                {/* Drop zone - right side (only active during drag) */}
                {draggedId && (
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1/2 z-40"
                    onDragOver={(e) => handleDragOver(e, index + 1)}
                  />
                )}

                {/* Left drop indicator */}
                {showIndicator && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 -translate-x-2 rounded-full z-50 shadow-[0_0_12px_3px_rgba(59,130,246,0.6)]" />
                )}

                {/* Drag Handle Bar */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, camera.id)}
                  onDragEnd={handleDragEnd}
                  className="h-6 bg-gray-700 hover:bg-gray-600 rounded-t-lg flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 z-50"
                >
                  <GripHorizontal className="w-4 h-4 text-gray-400" />
                </div>

                {/* Camera View */}
                <div className="flex-1 min-h-0">
                  <CameraView
                    camera={camera}
                    onRemove={handleRemove}
                    onMaximize={handleMaximize}
                    onSettings={onCameraSettings}
                    onEventTriggered={onEventTriggered}
                    displaySettings={getDisplaySettings(camera.id)}
                    className="h-full w-full rounded-t-none"
                  />
                </div>

                {/* Right drop indicator (for last item) */}
                {showEndIndicator && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 translate-x-2 rounded-full z-50 shadow-[0_0_12px_3px_rgba(59,130,246,0.6)]" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
