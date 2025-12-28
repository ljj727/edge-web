import { useState, useEffect } from 'react'
import { Button } from '@shared/ui'
import { Plus, Video, Camera, Check, Trash2, RefreshCw, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useCameras, useCreateCamera, useDeleteCamera, useSyncCameras, useCameraStore } from '@features/camera'
import { useInferencesByVideo, useCreateInference, useDeleteInference, useInferenceStatuses } from '@features/inference'
import { CameraGrid } from '@widgets/camera-grid'
import { CameraForm } from '@widgets/camera-form'
import { VisionAppPanel, type VisionApp } from '@widgets/vision-app-panel'
import { AssignVisionAppDialog } from '@widgets/vision-app-dialog'
import { EventSettingsDialog } from '@widgets/event-settings-dialog'
import { cn } from '@shared/lib/cn'
import type { CameraCreate, Camera as CameraType, App } from '@shared/types'

export function VideoStreamPage() {
  const { data: cameras, isLoading, refetch } = useCameras()
  const createCamera = useCreateCamera()
  const deleteCamera = useDeleteCamera()
  const syncCameras = useSyncCameras()

  const selectedCameraIds = useCameraStore((state) => state.selectedCameraIds)
  const toggleCameraSelection = useCameraStore((state) => state.toggleCameraSelection)
  const isFormOpen = useCameraStore((state) => state.isFormOpen)
  const setFormOpen = useCameraStore((state) => state.setFormOpen)

  // Vision App panel state
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [focusedCameraId, setFocusedCameraId] = useState<string | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)

  // Initialize focusedCameraId when cameras load and there are selected cameras
  useEffect(() => {
    if (!focusedCameraId && cameras && cameras.length > 0 && selectedCameraIds.length > 0) {
      // Focus on the first selected camera
      const firstSelected = cameras.find((c) => selectedCameraIds.includes(c.id))
      if (firstSelected) {
        setFocusedCameraId(firstSelected.id)
      }
    }
  }, [cameras, selectedCameraIds, focusedCameraId])

  // Inference hooks
  const { data: inferences } = useInferencesByVideo(focusedCameraId || '')
  const { data: inferenceStatuses } = useInferenceStatuses()
  const createInference = useCreateInference()
  const deleteInference = useDeleteInference()

  // Convert inferences to VisionApp format for display with real status
  const assignedApps: VisionApp[] = (inferences || []).map((inf) => {
    // Find matching status from inference status API
    const statusData = inferenceStatuses?.find(
      (s) => s.appId === inf.appId && s.videoId === focusedCameraId
    )
    // Map backend status code to VisionApp status
    // Backend: NG=0, READY=1, CONNECTING=2, CONNECTED=3
    const status: VisionApp['status'] =
      statusData?.err ? 'error' :
      statusData?.status === 3 ? 'connected' : 'disconnected'

    return {
      id: inf.appId,
      name: inf.name || inf.appId,
      version: '',
      status,
    }
  })

  // Event settings state
  const [isEventSettingsOpen, setIsEventSettingsOpen] = useState(false)
  const [selectedAppForEvents, setSelectedAppForEvents] = useState<VisionApp | null>(null)

  const focusedCamera = cameras?.find((c) => c.id === focusedCameraId) || null

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

  const handleCameraClick = (camera: CameraType) => {
    toggleCameraSelection(camera.id)
    setFocusedCameraId(camera.id)
  }

  const handleAssignApp = async (app: App) => {
    if (!focusedCameraId || !focusedCamera) return

    try {
      await createInference.mutateAsync({
        appId: app.id,
        videoId: focusedCameraId,
        uri: focusedCamera.rtsp_url,
        name: `${app.name} - ${focusedCamera.name}`,
        settings: {
          version: '1.0',
          configs: [],
        },
      })
      // React Query automatically invalidates via onSuccess hook
    } catch (error) {
      console.error('Failed to create inference:', error)
    }
  }

  const handleRemoveApp = async (appId: string) => {
    if (!focusedCameraId) return

    try {
      await deleteInference.mutateAsync({ appId, videoId: focusedCameraId })
      // React Query automatically invalidates via onSuccess hook
    } catch (error) {
      console.error('Failed to delete inference:', error)
    }
  }

  const handleConfigureEvents = (appId: string) => {
    if (!focusedCameraId) return
    const app = assignedApps.find((a) => a.id === appId)
    if (app) {
      setSelectedAppForEvents(app)
      setIsEventSettingsOpen(true)
    }
  }


  return (
    <div className="flex h-full">
      {/* Left Panel - Camera List */}
      <div className="w-72 border-r flex flex-col shrink-0">
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
                onClick={async () => {
                  await syncCameras.mutateAsync()
                  refetch()
                }}
                disabled={syncCameras.isPending}
                title="Sync & Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${syncCameras.isPending ? 'animate-spin' : ''}`} />
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
            Select cameras to display and manage Vision Apps
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
                const isFocused = focusedCameraId === camera.id
                // Show app count only for focused camera
                const appCount = isFocused ? assignedApps.length : 0
                return (
                  <div
                    key={camera.id}
                    className={cn(
                      'rounded-lg border p-3 cursor-pointer transition-colors',
                      isFocused
                        ? 'border-primary bg-primary/10'
                        : isSelected
                        ? 'border-primary/50 bg-primary/5'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => handleCameraClick(camera)}
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
                        {appCount > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            {appCount} Vision App{appCount > 1 ? 's' : ''} assigned
                          </p>
                        )}
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

      {/* Middle Panel - Camera Grid */}
      <div className="flex-1 flex flex-col min-w-0">
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
          className="flex-1"
        />
      </div>

      {/* Right Panel - Vision App Management */}
      <div
        className={cn(
          'border-l flex flex-col transition-all duration-300 shrink-0',
          isPanelOpen ? 'w-80' : 'w-12'
        )}
      >
        {/* Panel Toggle */}
        <div className="p-2 border-b flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            title={isPanelOpen ? 'Close Panel' : 'Open Panel'}
          >
            {isPanelOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isPanelOpen && (
          <VisionAppPanel
            camera={focusedCamera}
            assignedApps={assignedApps}
            onAssignApp={() => setIsAssignDialogOpen(true)}
            onRemoveApp={handleRemoveApp}
            onConfigureEvents={handleConfigureEvents}
            onCameraSettings={() => {
              // TODO: Implement camera settings
              console.log('Camera settings')
              alert('Camera settings not implemented yet')
            }}
            className="flex-1"
          />
        )}
      </div>

      {/* Assign Vision App Dialog */}
      <AssignVisionAppDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        onAssign={handleAssignApp}
        assignedAppIds={assignedApps.map((a) => a.id)}
      />

      {/* Event Settings Dialog */}
      <EventSettingsDialog
        isOpen={isEventSettingsOpen}
        onClose={() => {
          setIsEventSettingsOpen(false)
          setSelectedAppForEvents(null)
        }}
        app={selectedAppForEvents}
        cameraId={focusedCameraId || ''}
        cameraName={focusedCamera?.name || ''}
      />
    </div>
  )
}
