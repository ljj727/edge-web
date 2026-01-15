import { useState, useRef, useCallback } from 'react'
import { Video } from 'lucide-react'
import { CameraView } from '@widgets/camera-view'
import { cn } from '@shared/lib/cn'
import { useCameraStore } from '@features/camera'
import type { Camera } from '@shared/types'

interface CameraGridProps {
  cameras: Camera[]
  selectedCameraIds: string[]
  onCameraSettings?: (id: string) => void
  onReorderCameras?: (newOrder: string[]) => void
  className?: string
}

export function CameraGrid({
  cameras,
  selectedCameraIds,
  onCameraSettings,
  onReorderCameras,
  className,
}: CameraGridProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  // dropIndex: the index where the dragged item will be inserted
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const dropIndexRef = useRef<number | null>(null)
  const getDisplaySettings = useCameraStore((state) => state.getDisplaySettings)

  // Track playing status for each camera
  const [playingCameras, setPlayingCameras] = useState<Set<string>>(new Set())

  const handleStatusChange = useCallback((cameraId: string, isPlaying: boolean) => {
    setPlayingCameras((prev) => {
      const next = new Set(prev)
      if (isPlaying) {
        next.add(cameraId)
      } else {
        next.delete(cameraId)
      }
      return next
    })
  }, [])

  // Get selected cameras in order
  const selectedCameras = selectedCameraIds
    .map((id) => cameras.find((c) => c.id === id))
    .filter((c): c is Camera => c !== undefined)

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

  return (
    <div className={cn('h-full bg-muted/30', className)}>
      {selectedCameras.length === 0 ? (
        // Empty state
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
          <Video className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium mb-2">No Cameras Selected</p>
          <p className="text-sm">Select cameras from above</p>
        </div>
      ) : (
        // Card layout for cameras - grid for 4, row for 1-3
        <div
          className={cn(
            'h-full p-3 gap-3',
            selectedCameras.length <= 3
              ? 'flex flex-row items-center justify-center'
              : 'grid grid-cols-2 grid-rows-2 place-items-center'
          )}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={handleDragLeave}
        >
          {selectedCameras.map((camera, index) => {
            const isDragging = draggedId === camera.id
            const showIndicator = dropIndex === index
            const showEndIndicator = index === selectedCameras.length - 1 && dropIndex === selectedCameras.length
            const isPlaying = playingCameras.has(camera.id)

            return (
              <div
                key={camera.id}
                className={cn(
                  'relative h-full max-h-full',
                  isDragging && 'opacity-30'
                )}
                style={{ aspectRatio: '9/16' }}
                onDragOver={(e) => {
                  e.preventDefault()
                  // Determine if dropping on left or right half
                  const rect = e.currentTarget.getBoundingClientRect()
                  const midX = rect.left + rect.width / 2
                  if (e.clientX < midX) {
                    handleDragOver(e, index)
                  } else {
                    handleDragOver(e, index + 1)
                  }
                }}
              >
                {/* Left drop indicator */}
                {showIndicator && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 -translate-x-2 rounded-full z-50 shadow-[0_0_12px_3px_rgba(59,130,246,0.6)]" />
                )}

                {/* Camera Card */}
                <div
                  className="h-full w-full flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => handleDragStart(e, camera.id)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
                    <span className="font-semibold text-sm">{camera.name}</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        isPlaying
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {isPlaying ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  {/* Camera View */}
                  <div className="flex-1 min-h-0 p-2">
                    <CameraView
                      camera={camera}
                      onSettings={onCameraSettings}
                      onStatusChange={handleStatusChange}
                      displaySettings={getDisplaySettings(camera.id)}
                      className="w-full h-full"
                    />
                  </div>
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
