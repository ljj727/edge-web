import { useEffect, useState } from 'react'
import { Video, X, Square, Tag, Percent, Activity, MapPin } from 'lucide-react'
import { useCameras, useCameraStore } from '@features/camera'
import { CameraGrid } from '@widgets/camera-grid'
import { cn } from '@shared/lib/cn'

// 표시 설정 토글 옵션
const DISPLAY_TOGGLES = [
  { key: 'showBoundingBox' as const, icon: Square, label: 'Bounding Box' },
  { key: 'showLabel' as const, icon: Tag, label: 'Label' },
  { key: 'showScore' as const, icon: Percent, label: 'Score' },
  { key: 'showKeypoints' as const, icon: Activity, label: 'Keypoints' },
  { key: 'showEventSettings' as const, icon: MapPin, label: 'Event Zone/Line' },
]

export function VideoStreamPage() {
  const { data: cameras, isLoading } = useCameras()

  const selectedCameraIds = useCameraStore((state) => state.selectedCameraIds)
  const setSelectedCameraIds = useCameraStore((state) => state.setSelectedCameraIds)
  const getDisplaySettings = useCameraStore((state) => state.getDisplaySettings)
  const setDisplaySettings = useCameraStore((state) => state.setDisplaySettings)

  // 표시 설정 팝업 상태
  const [settingsCameraId, setSettingsCameraId] = useState<string | null>(null)

  // Auto-select first camera if none selected
  useEffect(() => {
    if (cameras && cameras.length > 0 && selectedCameraIds.length === 0) {
      setSelectedCameraIds([cameras[0].id])
    }
  }, [cameras, selectedCameraIds.length, setSelectedCameraIds])

  const handleRemoveFromGrid = (id: string) => {
    setSelectedCameraIds(selectedCameraIds.filter((cid) => cid !== id))
  }

  const handleReorderCameras = (newOrder: string[]) => {
    setSelectedCameraIds(newOrder)
  }

  const handleCameraSelect = (cameraId: string) => {
    if (selectedCameraIds.includes(cameraId)) {
      setSelectedCameraIds(selectedCameraIds.filter((id) => id !== cameraId))
    } else if (selectedCameraIds.length < 4) {
      setSelectedCameraIds([...selectedCameraIds, cameraId])
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Camera Selection Bar */}
      <div className="border-b p-3 flex items-center gap-4 bg-card shrink-0">
        <span className="text-sm font-medium text-muted-foreground">Cameras:</span>
        <div className="flex flex-wrap gap-2">
          {cameras?.map((camera) => {
            const isSelected = selectedCameraIds.includes(camera.id)
            return (
              <button
                key={camera.id}
                onClick={() => handleCameraSelect(camera.id)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                {camera.name}
              </button>
            )
          })}
          {(!cameras || cameras.length === 0) && (
            <span className="text-sm text-muted-foreground">No cameras available</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        {selectedCameraIds.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Video className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">No Camera Selected</p>
            <p className="text-sm">Select a camera from above to view stream</p>
          </div>
        ) : (
          <CameraGrid
            cameras={cameras || []}
            selectedCameraIds={selectedCameraIds}
            onRemoveCamera={handleRemoveFromGrid}
            onReorderCameras={handleReorderCameras}
            onCameraSettings={(id) => setSettingsCameraId(id)}
            className="flex-1"
          />
        )}
      </div>

      {/* Display Settings Popup */}
      {settingsCameraId && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSettingsCameraId(null)}
        >
          <div
            className="bg-gray-900 rounded-lg border border-gray-700 p-4 w-72 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">표시 설정</h3>
              <button
                onClick={() => setSettingsCameraId(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {DISPLAY_TOGGLES.map((toggle) => {
                const Icon = toggle.icon
                const settings = getDisplaySettings(settingsCameraId)
                const isEnabled = settings[toggle.key] !== false
                return (
                  <button
                    key={toggle.key}
                    onClick={() => {
                      setDisplaySettings(settingsCameraId, {
                        ...settings,
                        [toggle.key]: !isEnabled,
                      })
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isEnabled
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{toggle.label}</span>
                    <div className="ml-auto">
                      <div
                        className={cn(
                          'w-8 h-4 rounded-full transition-colors relative',
                          isEnabled ? 'bg-blue-500' : 'bg-gray-600'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
                            isEnabled ? 'translate-x-4' : 'translate-x-0.5'
                          )}
                        />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
