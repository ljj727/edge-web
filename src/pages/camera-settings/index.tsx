import { useState, useEffect } from 'react'
import { Camera, RefreshCw, Save, Plus, Trash2, X } from 'lucide-react'
import { useCameras, useCreateCamera, useDeleteCamera, useSyncCameras, useUpdateCamera } from '@features/camera'
import { CameraForm } from '@widgets/camera-form'
import { cn } from '@shared/lib/cn'
import type { CameraCreate, Camera as CameraType } from '@shared/types'

interface CameraCardState {
  name: string
  rtsp_url: string
  is_active: boolean
  saving: boolean
}

export function CameraSettingsPage() {
  const { data: cameras, isLoading, refetch } = useCameras()
  const createCamera = useCreateCamera()
  const deleteCamera = useDeleteCamera()
  const syncCameras = useSyncCameras()
  const updateCamera = useUpdateCamera()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [cardStates, setCardStates] = useState<Record<string, CameraCardState>>({})
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Initialize card states from cameras
  useEffect(() => {
    if (!cameras) return
    setCardStates((prev) => {
      const next: Record<string, CameraCardState> = {}
      for (const camera of cameras) {
        next[camera.id] = prev[camera.id] || {
          name: camera.name,
          rtsp_url: camera.rtsp_url,
          is_active: camera.is_active,
          saving: false,
        }
      }
      return next
    })
  }, [cameras])

  const handleAddCamera = async (data: CameraCreate) => {
    try {
      await createCamera.mutateAsync(data)
      setIsFormOpen(false)
      setToast({ type: 'success', message: '카메라가 추가되었습니다' })
    } catch (err) {
      setToast({ type: 'error', message: '추가 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류') })
    } finally {
      setTimeout(() => setToast(null), 3000)
    }
  }

  const handleDeleteCamera = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteCamera.mutateAsync(id)
      setToast({ type: 'success', message: '카메라가 삭제되었습니다' })
    } catch (err) {
      setToast({ type: 'error', message: '삭제 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류') })
    } finally {
      setDeletingId(null)
      setTimeout(() => setToast(null), 3000)
    }
  }

  const handleCardChange = (id: string, field: keyof Omit<CameraCardState, 'saving'>, value: string | boolean) => {
    setCardStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  const handleSaveCard = async (camera: CameraType) => {
    const state = cardStates[camera.id]
    if (!state) return

    setCardStates((prev) => ({
      ...prev,
      [camera.id]: { ...prev[camera.id], saving: true },
    }))

    try {
      await updateCamera.mutateAsync({
        id: camera.id,
        data: {
          name: state.name,
          rtsp_url: state.rtsp_url,
          is_active: state.is_active,
        },
      })
      setToast({ type: 'success', message: '설정이 저장되었습니다' })
    } catch (err) {
      setToast({ type: 'error', message: '저장 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류') })
    } finally {
      setCardStates((prev) => ({
        ...prev,
        [camera.id]: { ...prev[camera.id], saving: false },
      }))
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'absolute top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-50 shadow-lg',
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        )}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Camera className="h-6 w-6" />
          <div>
            <h1 className="text-xl font-semibold">카메라 설정</h1>
            <p className="text-sm text-muted-foreground">{cameras?.length || 0}개의 카메라</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => { await syncCameras.mutateAsync(); refetch() }}
            disabled={syncCameras.isPending}
            className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', syncCameras.isPending && 'animate-spin')} />
            동기화
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            카메라 추가
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : cameras && cameras.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cameras.map((camera) => {
              const state = cardStates[camera.id]
              if (!state) return null

              return (
                <div
                  key={camera.id}
                  className="bg-card rounded-xl border shadow-sm overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">{camera.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          state.is_active
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {state.is_active ? 'ON' : 'OFF'}
                      </span>
                      <button
                        onClick={() => handleDeleteCamera(camera.id)}
                        disabled={deletingId === camera.id}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className={cn('h-4 w-4', deletingId === camera.id && 'animate-pulse')} />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Name
                      </label>
                      <input
                        value={state.name}
                        onChange={(e) => handleCardChange(camera.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-muted border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="카메라 이름"
                      />
                    </div>

                    {/* RTSP URL */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        RTSP URL
                      </label>
                      <input
                        value={state.rtsp_url}
                        onChange={(e) => handleCardChange(camera.id, 'rtsp_url', e.target.value)}
                        className="w-full px-3 py-2 bg-muted border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="rtsp://..."
                      />
                    </div>

                    {/* Enable */}
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">
                        Enable
                      </label>
                      <button
                        onClick={() => handleCardChange(camera.id, 'is_active', !state.is_active)}
                        className={cn(
                          'relative w-11 h-6 rounded-full transition-colors',
                          state.is_active ? 'bg-green-500' : 'bg-gray-300'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm',
                            state.is_active ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>

                    {/* Config API */}
                    <div className="pt-2 border-t">
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Config API: /api/v2/videos/{camera.id}
                      </p>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={() => handleSaveCard(camera)}
                      disabled={state.saving}
                      className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {state.saving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Camera className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">카메라 없음</p>
            <p className="text-sm mt-1">카메라를 추가하여 시작하세요</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              카메라 추가
            </button>
          </div>
        )}
      </div>

      {/* Add Camera Form Dialog */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsFormOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <CameraForm
              onSubmit={handleAddCamera}
              onCancel={() => setIsFormOpen(false)}
              isLoading={createCamera.isPending}
              className="w-full max-w-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}
