import { Button } from '@shared/ui'
import { Plus, Video, Camera, Check, Trash2, RefreshCw } from 'lucide-react'
import { useCameras, useCreateCamera, useDeleteCamera, useCameraStore } from '@features/camera'
import { CameraGrid } from '@widgets/camera-grid'
import { CameraForm } from '@widgets/camera-form'
import { cn } from '@shared/lib/cn'
import type { CameraCreate } from '@shared/types'

export function VideoStreamPage() {
  const { data: cameras, isLoading, refetch } = useCameras()
  const createCamera = useCreateCamera()
  const deleteCamera = useDeleteCamera()

  const selectedCameraIds = useCameraStore((state) => state.selectedCameraIds)
  const toggleCameraSelection = useCameraStore((state) => state.toggleCameraSelection)
  const isFormOpen = useCameraStore((state) => state.isFormOpen)
  const setFormOpen = useCameraStore((state) => state.setFormOpen)

  const handleAddCamera = async (data: CameraCreate) => {
    await createCamera.mutateAsync(data)
  }

  const handleDeleteCamera = async (id: string) => {
    if (confirm('Are you sure you want to delete this camera?')) {
      await deleteCamera.mutateAsync(id)
    }
  }

  const handleRemoveFromGrid = (id: string) => {
    toggleCameraSelection(id)
  }

  return (
    <div className="flex h-full">
      {/* Left Panel - Camera List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Cameras
            </h2>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => refetch()}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Select up to 4 cameras to display in the grid
          </p>
        </div>

        {/* Camera List */}
        <div className="flex-1 overflow-auto p-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : cameras && cameras.length > 0 ? (
            <div className="space-y-2">
              {cameras.map((camera) => {
                const isSelected = selectedCameraIds.includes(camera.id)
                return (
                  <div
                    key={camera.id}
                    className={cn(
                      'rounded-lg border p-3 cursor-pointer transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => toggleCameraSelection(camera.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                          <p className="font-medium truncate">{camera.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {camera.id}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCamera(camera.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Video className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No Cameras</p>
              <p className="text-xs text-muted-foreground mb-3">
                Add your first camera to get started
              </p>
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Camera
              </Button>
            </div>
          )}
        </div>

        {/* Selected count */}
        {cameras && cameras.length > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              {selectedCameraIds.length} of {Math.min(4, cameras.length)} cameras selected
            </p>
          </div>
        )}
      </div>

      {/* Right Panel - Camera Grid */}
      <div className="flex-1 flex flex-col">
        {/* Add Camera Form (Overlay) */}
        {isFormOpen && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <CameraForm
              onSubmit={handleAddCamera}
              onCancel={() => setFormOpen(false)}
              isLoading={createCamera.isPending}
              className="w-full max-w-md"
            />
          </div>
        )}

        {/* Grid View */}
        <CameraGrid
          cameras={cameras || []}
          selectedCameraIds={selectedCameraIds}
          onRemoveCamera={handleRemoveFromGrid}
          onAddCamera={() => setFormOpen(true)}
          className="flex-1"
        />
      </div>
    </div>
  )
}
