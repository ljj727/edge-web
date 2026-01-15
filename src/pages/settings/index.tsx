import { useRef, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@shared/ui'
import {
  Settings, RefreshCw, Power, AlertTriangle, Brain,
  CheckCircle, XCircle, Loader2, Trash2, Plus, Camera, Save, X, ChevronDown
} from 'lucide-react'
import { useApps, useUploadApp, useDeleteApp } from '@features/app'
import { useSystemRestart, type RestartStep } from '@features/system'
import { useCameras, useCreateCamera, useDeleteCamera, useSyncCameras, useUpdateCamera } from '@features/camera'
import { useInferencesByVideo, useCreateInference, useDeleteInference } from '@features/inference'
import { CameraForm } from '@widgets/camera-form'
import { cn } from '@shared/lib/cn'
import type { CameraCreate, Camera as CameraType, App } from '@shared/types'

interface CameraCardState {
  name: string
  rtsp_url: string
  is_active: boolean
  saving: boolean
}

export function SettingsPage() {
  // System restart state
  const [restartSteps, setRestartSteps] = useState<RestartStep[]>([])
  const [isRestarting, setIsRestarting] = useState(false)
  const { restart } = useSystemRestart()

  const handleRestart = async () => {
    setIsRestarting(true)
    setRestartSteps([])

    await restart((step) => {
      setRestartSteps((prev) => {
        const existing = prev.findIndex((s) => s.step === step.step)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = step
          return updated
        }
        return [...prev, step]
      })
    })

    setIsRestarting(false)
  }

  // Vision Apps
  const { data: apps, isLoading: appsLoading } = useApps()
  const uploadApp = useUploadApp()
  const deleteApp = useDeleteApp()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadApp.mutate(file)
      e.target.value = ''
    }
  }

  const handleDeleteApp = (id: string) => {
    deleteApp.mutate(id)
  }

  // Camera Settings
  const { data: cameras, isLoading: camerasLoading, refetch: refetchCameras } = useCameras()
  const createCamera = useCreateCamera()
  const deleteCameraApi = useDeleteCamera()
  const syncCameras = useSyncCameras()
  const updateCamera = useUpdateCamera()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [cardStates, setCardStates] = useState<Record<string, CameraCardState>>({})
  const [cameraToast, setCameraToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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
      setCameraToast({ type: 'success', message: '카메라가 추가되었습니다' })
    } catch (err) {
      setCameraToast({ type: 'error', message: '추가 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류') })
    } finally {
      setTimeout(() => setCameraToast(null), 3000)
    }
  }

  const handleDeleteCamera = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteCameraApi.mutateAsync(id)
      setCameraToast({ type: 'success', message: '카메라가 삭제되었습니다' })
    } catch (err) {
      setCameraToast({ type: 'error', message: '삭제 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류') })
    } finally {
      setDeletingId(null)
      setTimeout(() => setCameraToast(null), 3000)
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
      setCameraToast({ type: 'success', message: '설정이 저장되었습니다' })
    } catch (err) {
      setCameraToast({ type: 'error', message: '저장 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류') })
    } finally {
      setCardStates((prev) => ({
        ...prev,
        [camera.id]: { ...prev[camera.id], saving: false },
      }))
      setTimeout(() => setCameraToast(null), 3000)
    }
  }

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage system settings and vision apps
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5" />
              System Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={handleRestart} disabled={isRestarting}>
                <RefreshCw className={cn('mr-2 h-4 w-4', isRestarting && 'animate-spin')} />
                Restart System
              </Button>
              <Button variant="destructive">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Factory Reset
              </Button>
            </div>
            {restartSteps.length > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-medium">System Restart Progress</p>
                {restartSteps.map((step) => (
                  <div key={step.step} className="flex items-center gap-3">
                    {step.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    {step.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {step.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                    <span
                      className={cn(
                        'text-sm',
                        step.status === 'loading' && 'text-blue-600',
                        step.status === 'success' && 'text-green-600',
                        step.status === 'error' && 'text-red-600'
                      )}
                    >
                      {step.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Camera Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Settings
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={async () => { await syncCameras.mutateAsync(); refetchCameras() }}
                  disabled={syncCameras.isPending}
                >
                  <RefreshCw className={cn('mr-2 h-4 w-4', syncCameras.isPending && 'animate-spin')} />
                  동기화
                </Button>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  카메라 추가
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Toast */}
            {cameraToast && (
              <div className={cn(
                'mb-4 px-4 py-2 rounded-lg text-sm font-medium',
                cameraToast.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}>
                {cameraToast.message}
              </div>
            )}

            {camerasLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 rounded bg-muted" />
                ))}
              </div>
            ) : cameras && cameras.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {cameras.map((camera) => {
                  const state = cardStates[camera.id]
                  if (!state) return null

                  return (
                    <CameraCard
                      key={camera.id}
                      camera={camera}
                      state={state}
                      apps={apps || []}
                      deletingId={deletingId}
                      onDelete={handleDeleteCamera}
                      onChange={handleCardChange}
                      onSave={handleSaveCard}
                      onToast={setCameraToast}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Camera className="h-12 w-12 mb-2" />
                <p>카메라 없음</p>
                <p className="text-sm">카메라를 추가하여 시작하세요</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vision Apps */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Vision Apps
              </CardTitle>
              <Button onClick={handleUploadClick} disabled={uploadApp.isPending}>
                {uploadApp.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Upload App
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </CardHeader>
          <CardContent>
            {appsLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 rounded bg-muted" />
                ))}
              </div>
            ) : apps && apps.length > 0 ? (
              <div className="space-y-2">
                {apps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{app.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.id}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteApp(app.id)}
                      disabled={deleteApp.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mb-2" />
                <p>No vision apps installed</p>
                <p className="text-sm">Upload a .zip file to add a vision app</p>
              </div>
            )}
          </CardContent>
        </Card>
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

// =============================================================================
// Camera Card Component
// =============================================================================

interface CameraCardProps {
  camera: CameraType
  state: CameraCardState
  apps: App[]
  deletingId: string | null
  onDelete: (id: string) => void
  onChange: (id: string, field: keyof Omit<CameraCardState, 'saving'>, value: string | boolean) => void
  onSave: (camera: CameraType) => void
  onToast: (toast: { type: 'success' | 'error'; message: string } | null) => void
}

function CameraCard({ camera, state, apps, deletingId, onDelete, onChange, onSave, onToast }: CameraCardProps) {
  const [isAppDropdownOpen, setIsAppDropdownOpen] = useState(false)
  const [connectingAppId, setConnectingAppId] = useState<string | null>(null)

  // Fetch inference for this camera
  const { data: inferences } = useInferencesByVideo(camera.id)
  const createInference = useCreateInference()
  const deleteInference = useDeleteInference()

  // Current connected app
  const connectedInference = inferences?.[0]
  const connectedAppId = connectedInference?.appId
  const connectedApp = apps.find(a => a.id === connectedAppId)

  // Handle app selection
  const handleAppSelect = async (appId: string | null) => {
    setIsAppDropdownOpen(false)

    if (appId === connectedAppId) return // No change

    setConnectingAppId(appId || 'disconnecting')

    try {
      // Disconnect current app if exists
      if (connectedInference) {
        await deleteInference.mutateAsync({ appId: connectedInference.appId, videoId: camera.id })
      }

      // Connect new app if selected
      if (appId) {
        const app = apps.find(a => a.id === appId)
        await createInference.mutateAsync({
          appId,
          videoId: camera.id,
          uri: camera.rtsp_url,
          name: `${app?.name || appId} - ${camera.name}`,
          settings: { version: '1.0', configs: [] },
        })
        onToast({ type: 'success', message: 'Vision App이 연결되었습니다' })
      } else {
        onToast({ type: 'success', message: 'Vision App 연결이 해제되었습니다' })
      }
    } catch (err) {
      onToast({ type: 'error', message: '연결 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류') })
    } finally {
      setConnectingAppId(null)
      setTimeout(() => onToast(null), 3000)
    }
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
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
            onClick={() => onDelete(camera.id)}
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
            onChange={(e) => onChange(camera.id, 'name', e.target.value)}
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
            onChange={(e) => onChange(camera.id, 'rtsp_url', e.target.value)}
            className="w-full px-3 py-2 bg-muted border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="rtsp://..."
          />
        </div>

        {/* Vision App Selection */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Vision App
          </label>
          <div className="relative">
            <button
              onClick={() => setIsAppDropdownOpen(!isAppDropdownOpen)}
              disabled={connectingAppId !== null}
              className={cn(
                'w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between transition-colors',
                connectedApp
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              <div className="flex items-center gap-2">
                {connectingAppId ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className={cn('h-4 w-4', connectedApp ? 'text-green-600' : 'text-muted-foreground')} />
                )}
                <span className={connectedApp ? 'font-medium' : 'text-muted-foreground'}>
                  {connectingAppId ? '연결 중...' : connectedApp ? connectedApp.name : '선택 안함'}
                </span>
              </div>
              <ChevronDown className={cn('h-4 w-4 transition-transform', isAppDropdownOpen && 'rotate-180')} />
            </button>

            {/* Dropdown */}
            {isAppDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-card border rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={() => handleAppSelect(null)}
                  className={cn(
                    'w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2',
                    !connectedApp && 'bg-muted'
                  )}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                  선택 안함
                </button>
                {apps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => handleAppSelect(app.id)}
                    className={cn(
                      'w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2',
                      connectedAppId === app.id && 'bg-green-50 text-green-700'
                    )}
                  >
                    <Brain className={cn('h-4 w-4', connectedAppId === app.id ? 'text-green-600' : 'text-muted-foreground')} />
                    {app.name}
                  </button>
                ))}
                {apps.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    등록된 App이 없습니다
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enable */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            Enable
          </label>
          <button
            onClick={() => onChange(camera.id, 'is_active', !state.is_active)}
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

        {/* Save Button */}
        <button
          onClick={() => onSave(camera)}
          disabled={state.saving}
          className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {state.saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
