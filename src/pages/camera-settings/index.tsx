import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Camera, Plus, Trash2, RefreshCw, Video, Save, ChevronDown,
  RotateCcw, Layers, Eye,
  Car, Truck, Bus, Bike, User, Dog, Cat, CircleDot, type LucideIcon
} from 'lucide-react'
import { connect, StringCodec } from 'nats.ws'
import type { NatsConnection } from 'nats.ws'
import { useCameras, useCreateCamera, useDeleteCamera, useSyncCameras, useUpdateCamera } from '@features/camera'
import { useApps } from '@features/app'
import { useInferencesByVideo, useCreateInference, useUpdateInference, useUpdateEventSettings } from '@features/inference'
import { CameraForm } from '@widgets/camera-form'
import { cn } from '@shared/lib/cn'
import type { CameraCreate, Camera as CameraType, App } from '@shared/types'

// Label 아이콘 및 이름 매핑
const LABEL_CONFIG: Record<string, { icon: LucideIcon; name: string }> = {
  car: { icon: Car, name: '승용차' },
  truck: { icon: Truck, name: '트럭' },
  bus: { icon: Bus, name: '버스' },
  motorcycle: { icon: Bike, name: '오토바이' },
  bicycle: { icon: Bike, name: '자전거' },
  person: { icon: User, name: '사람' },
  dog: { icon: Dog, name: '강아지' },
  cat: { icon: Cat, name: '고양이' },
}

// 기본 아이콘 (매핑에 없는 label용)
const DEFAULT_LABEL_ICON = CircleDot

// Label 정보 가져오기
function getLabelInfo(label: string): { icon: LucideIcon; name: string } {
  return LABEL_CONFIG[label] || { icon: DEFAULT_LABEL_ICON, name: label }
}

// 카메라 위치별 템플릿 (전방우측, 전방좌측, 후방우측, 후방좌측)
const CAMERA_TEMPLATES = {
  // 전방 우측 (cam1)
  frontRight: {
    zone: [[0.05, 0.94], [0.25, 0.02], [0.95, 0.05], [0.85, 0.90]] as [number, number][],
    line1: [[0.39, 0.99], [0.88, 0.30]] as [number, number][],
    line1Direction: 'A2B' as const,
    line2: [[0.01, 0.72], [0.66, 0.92]] as [number, number][],
    line2Direction: 'A2B' as const,
  },
  // 전방 좌측 (cam2)
  frontLeft: {
    zone: [[0.05, 0.05], [0.95, 0.02], [0.75, 0.90], [0.15, 0.94]] as [number, number][],
    line1: [[0.12, 0.30], [0.61, 0.99]] as [number, number][],
    line1Direction: 'A2B' as const,
    line2: [[0.34, 0.92], [0.99, 0.72]] as [number, number][],
    line2Direction: 'A2B' as const,
  },
  // 후방 우측 (cam4)
  rearRight: {
    zone: [[0.15, 0.06], [0.85, 0.10], [0.95, 0.95], [0.05, 0.98]] as [number, number][],
    line1: [[0.88, 0.70], [0.39, 0.01]] as [number, number][],
    line1Direction: 'B2A' as const,
    line2: [[0.66, 0.08], [0.01, 0.28]] as [number, number][],
    line2Direction: 'B2A' as const,
  },
  // 후방 좌측 (cam5)
  rearLeft: {
    zone: [[0.15, 0.10], [0.85, 0.06], [0.95, 0.98], [0.05, 0.95]] as [number, number][],
    line1: [[0.12, 0.70], [0.61, 0.01]] as [number, number][],
    line1Direction: 'B2A' as const,
    line2: [[0.34, 0.08], [0.99, 0.28]] as [number, number][],
    line2Direction: 'B2A' as const,
  },
}

type TemplateKey = keyof typeof CAMERA_TEMPLATES

type ActiveElement = 'zone' | 'line1' | 'line2' | null

export function CameraSettingsPage() {
  const { data: cameras, isLoading, refetch } = useCameras()
  const { data: apps } = useApps()
  const createCamera = useCreateCamera()
  const deleteCamera = useDeleteCamera()
  const syncCameras = useSyncCameras()
  const updateCamera = useUpdateCamera()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Select first camera on load
  useEffect(() => {
    if (cameras && cameras.length > 0 && !selectedCameraId) {
      setSelectedCameraId(cameras[0].id)
    }
  }, [cameras, selectedCameraId])

  const selectedCamera = cameras?.find(c => c.id === selectedCameraId) || null

  const handleAddCamera = async (data: CameraCreate) => {
    const newCamera = await createCamera.mutateAsync(data)
    setIsFormOpen(false)
    setSelectedCameraId(newCamera.id)
  }

  const handleDeleteCamera = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteCamera.mutateAsync(id)
      if (selectedCameraId === id) {
        const remaining = cameras?.filter(c => c.id !== id)
        setSelectedCameraId(remaining?.[0]?.id || null)
      }
    } catch (err) {
      // Silent fail - error already logged by mutation
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="h-full flex bg-gray-950">
      {/* Left Sidebar - Camera List */}
      <div className="w-72 border-r border-gray-800 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Camera className="h-5 w-5" />
              카메라
            </h2>
            <div className="flex gap-1">
              <button
                onClick={async () => { await syncCameras.mutateAsync(); refetch() }}
                disabled={syncCameras.isPending}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="동기화"
              >
                <RefreshCw className={cn('h-4 w-4', syncCameras.isPending && 'animate-spin')} />
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="추가"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">{cameras?.length || 0}개의 카메라</p>
        </div>

        {/* Camera List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : cameras && cameras.length > 0 ? (
            <div className="space-y-1">
              {cameras.map((camera) => (
                <div
                  key={camera.id}
                  onClick={() => setSelectedCameraId(camera.id)}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-all group cursor-pointer',
                    selectedCameraId === camera.id
                      ? 'bg-white/10 border border-white/20'
                      : 'hover:bg-gray-800/50 border border-transparent'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        camera.is_active ? 'bg-green-500' : 'bg-gray-500'
                      )} />
                      <span className="text-sm font-medium text-white truncate">{camera.name}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCamera(camera.id) }}
                      disabled={deletingId === camera.id}
                      className={cn(
                        'p-1 rounded text-red-400 transition-all',
                        deletingId === camera.id
                          ? 'opacity-100 animate-pulse'
                          : 'opacity-0 group-hover:opacity-100 hover:bg-red-500/20'
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1 font-mono">{camera.id}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <Video className="h-10 w-10 mb-3" />
              <p className="text-sm">카메라 없음</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Content - Settings Panel */}
      <div className="flex-1 overflow-hidden">
        {selectedCamera ? (
          <CameraSettingsPanel
            camera={selectedCamera}
            apps={apps || []}
            updateCamera={updateCamera}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <Camera className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">카메라를 선택하세요</p>
            <p className="text-sm mt-1">왼쪽 목록에서 카메라를 선택하면 설정을 변경할 수 있습니다</p>
          </div>
        )}
      </div>

      {/* Add Camera Form Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <CameraForm
            onSubmit={handleAddCamera}
            onCancel={() => setIsFormOpen(false)}
            isLoading={createCamera.isPending}
            className="w-full max-w-sm"
          />
        </div>
      )}
    </div>
  )
}

// Camera Settings Panel Component
interface CameraSettingsPanelProps {
  camera: CameraType
  apps: App[]
  updateCamera: ReturnType<typeof useUpdateCamera>
}

function CameraSettingsPanel({ camera, apps, updateCamera }: CameraSettingsPanelProps) {
  // Camera info
  const [cameraName, setCameraName] = useState('')
  const [rtspUrl, setRtspUrl] = useState('')

  // App & Detection
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)

  // Detection elements - Zone (ROI)
  const [zone, setZone] = useState<[number, number][]>([])
  const [zoneTargets, setZoneTargets] = useState<string[]>(['car', 'person'])

  // Detection elements - Line 1
  const [line1, setLine1] = useState<[number, number][]>([])
  const [line1Direction, setLine1Direction] = useState<'A2B' | 'B2A'>('A2B')
  const [line1WarningDistance, setLine1WarningDistance] = useState<number>(0.03)

  // Detection elements - Line 2
  const [line2, setLine2] = useState<[number, number][]>([])
  const [line2Direction, setLine2Direction] = useState<'A2B' | 'B2A'>('A2B')
  const [line2WarningDistance, setLine2WarningDistance] = useState<number>(0.03)

  const [activeElement, setActiveElement] = useState<ActiveElement>(null)


  // Saving states
  const [savingCamera, setSavingCamera] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const ncRef = useRef<NatsConnection | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  // Hooks
  const { data: inferences } = useInferencesByVideo(camera.id)
  const createInference = useCreateInference()
  const updateInference = useUpdateInference()
  const updateEventSettings = useUpdateEventSettings()

  // Load settings when camera changes
  useEffect(() => {
    setCameraName(camera.name)
    setRtspUrl(camera.rtsp_url)
    setActiveElement(null)
    // Reset zone
    setZone([])
    setZoneTargets(['car', 'person'])
    // Reset line 1
    setLine1([])
    setLine1Direction('A2B')
    setLine1WarningDistance(0.03)
    // Reset line 2
    setLine2([])
    setLine2Direction('A2B')
    setLine2WarningDistance(0.03)
    setSelectedAppId(null)
    setThumbnail(null)
    setImageDimensions(null)
    imageRef.current = null
  }, [camera.id])

  // Load inference settings
  useEffect(() => {
    if (!inferences) return
    const existingInference = inferences[0]
    if (existingInference) {
      setSelectedAppId(existingInference.appId)
      if (existingInference.settings?.configs) {
        const configs = existingInference.settings.configs

        // Load ROI config
        const zoneConfig = configs.find((c) => c.eventType === 'ROI' || c.eventType === 'RoI')
        if (zoneConfig) {
          if (zoneConfig.points) setZone(zoneConfig.points)
          // targets can be string[] or { label: string }[]
          if (zoneConfig.targets && zoneConfig.targets.length > 0) {
            const firstTarget = zoneConfig.targets[0]
            if (typeof firstTarget === 'string') {
              setZoneTargets(zoneConfig.targets)
            } else if (firstTarget && typeof firstTarget === 'object' && 'label' in firstTarget) {
              setZoneTargets(zoneConfig.targets.map((t: any) => t.label))
            }
          } else if (zoneConfig.target && 'labels' in zoneConfig.target) {
            setZoneTargets(zoneConfig.target.labels)
          }
        }

        // Load Line configs by eventSettingId
        const lineConfigs = configs.filter((c) => c.eventType === 'Line')
        const loadLineConfig = (
          config: typeof lineConfigs[0] | undefined,
          setPoints: typeof setLine1,
          setDirection: typeof setLine1Direction,
          setWarningDistance: typeof setLine1WarningDistance
        ) => {
          if (!config) return
          if (config.points) setPoints(config.points)
          if (config.direction && config.direction !== 'BOTH') {
            setDirection(config.direction as 'A2B' | 'B2A')
          }
          // warningDistance: use saved value or default 0.03
          setWarningDistance(config.warningDistance ?? 0.03)
        }
        // Match by eventSettingId (new: line-front/line-side, old: line_entry-*/line_exit-*)
        const lineFrontConfig = lineConfigs.find((c) =>
          c.eventSettingId === 'line-front' || c.eventSettingId?.startsWith('line_entry')
        )
        const lineSideConfig = lineConfigs.find((c) =>
          c.eventSettingId === 'line-side' || c.eventSettingId?.startsWith('line_exit')
        )
        loadLineConfig(lineFrontConfig, setLine1, setLine1Direction, setLine1WarningDistance)
        loadLineConfig(lineSideConfig, setLine2, setLine2Direction, setLine2WarningDistance)
      }
    }
  }, [inferences])

  // Fetch thumbnail from NATS
  useEffect(() => {
    if (!camera.nats_subject || !camera.nats_ws_url) return
    let cancelled = false
    const sc = StringCodec()

    const fetchThumbnail = async () => {
      try {
        const nc = await connect({ servers: camera.nats_ws_url! })
        if (cancelled) { await nc.close(); return }
        ncRef.current = nc
        const sub = nc.subscribe(camera.nats_subject!, { max: 1 })
        for await (const msg of sub) {
          if (cancelled) break
          try {
            const data = JSON.parse(sc.decode(msg.data))
            if (data.image) {
              const url = `data:image/jpeg;base64,${data.image}`
              setThumbnail(url)
              const img = new Image()
              img.onload = () => {
                imageRef.current = img
                setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
              }
              img.src = url
            }
          } catch {
            const blob = new Blob([new Uint8Array(msg.data)], { type: 'image/jpeg' })
            const url = URL.createObjectURL(blob)
            setThumbnail(url)
            const img = new Image()
            img.onload = () => {
              imageRef.current = img
              setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
            }
            img.src = url
          }
          break
        }
      } catch {
        // Silent fail for thumbnail fetch
      }
    }

    fetchThumbnail()
    return () => { cancelled = true; ncRef.current?.close(); ncRef.current = null }
  }, [camera.nats_subject, camera.nats_ws_url])

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
    } else {
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = 1
      for (let i = 0; i < canvas.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke() }
      for (let i = 0; i < canvas.height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke() }
    }

    const toCanvas = (p: [number, number]): [number, number] => [p[0] * canvas.width, p[1] * canvas.height]

    // Draw zone
    if (zone.length > 0) {
      const points = zone.map(toCanvas)
      const isActive = activeElement === 'zone'
      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
      if (zone.length > 2) ctx.closePath()
      ctx.fillStyle = isActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15)'
      ctx.fill()
      ctx.strokeStyle = isActive ? '#3b82f6' : '#3b82f6aa'
      ctx.lineWidth = isActive ? 2 : 1
      ctx.stroke()
      if (isActive) {
        points.forEach((p) => {
          ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, Math.PI * 2)
          ctx.fillStyle = '#3b82f6'; ctx.fill()
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
        })
      }
    }

    // Draw lines with warning distance
    const drawLine = (
      linePoints: [number, number][],
      direction: string,
      color: string,
      isActive: boolean,
      label: string,
      warningDist: number
    ) => {
      if (linePoints.length === 0) return
      const points = linePoints.map(toCanvas)
      if (points.length === 2) {
        const [p1, p2] = points
        const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0])
        const perpAngle = angle + Math.PI / 2
        const warnPx = warningDist * Math.max(canvas.width, canvas.height)

        // Draw warning distance zone (화살표 반대쪽 = 진입 전 영역만)
        if (warningDist > 0 && isActive) {
          // A2B: 화살표가 perpAngle 방향 → WARNING은 반대쪽(perpAngle + PI)
          // B2A: 화살표가 perpAngle + PI 방향 → WARNING은 반대쪽(perpAngle)
          const warnAngle = direction === 'A2B' ? perpAngle + Math.PI : perpAngle

          ctx.beginPath()
          ctx.moveTo(p1[0], p1[1])
          ctx.lineTo(p2[0], p2[1])
          ctx.lineTo(p2[0] + Math.cos(warnAngle) * warnPx, p2[1] + Math.sin(warnAngle) * warnPx)
          ctx.lineTo(p1[0] + Math.cos(warnAngle) * warnPx, p1[1] + Math.sin(warnAngle) * warnPx)
          ctx.closePath()
          ctx.fillStyle = '#f59e0b30' // amber/warning color
          ctx.fill()
          ctx.strokeStyle = '#f59e0b60'
          ctx.lineWidth = 1
          ctx.setLineDash([4, 4])
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Draw main line
        ctx.beginPath()
        ctx.moveTo(p1[0], p1[1])
        ctx.lineTo(p2[0], p2[1])
        ctx.strokeStyle = isActive ? color : color + 'aa'
        ctx.lineWidth = isActive ? 3 : 2
        ctx.stroke()

        // Draw direction arrow
        const midX = (p1[0] + p2[0]) / 2
        const midY = (p1[1] + p2[1]) / 2
        const drawArrow = (arrowAngle: number, offset: number) => {
          ctx.save()
          ctx.translate(midX + Math.cos(arrowAngle) * offset, midY + Math.sin(arrowAngle) * offset)
          ctx.rotate(arrowAngle)
          ctx.beginPath()
          ctx.moveTo(8, 0)
          ctx.lineTo(-4, -5)
          ctx.lineTo(-4, 5)
          ctx.closePath()
          ctx.fillStyle = color
          ctx.fill()
          ctx.restore()
        }
        if (direction === 'A2B') drawArrow(perpAngle, 18)
        else if (direction === 'B2A') drawArrow(perpAngle + Math.PI, 18)

        // Draw label
        ctx.fillStyle = color
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(label, midX, midY - 25)
      }

      // Draw points
      points.forEach((p, i) => {
        ctx.beginPath()
        ctx.arc(p[0], p[1], isActive ? 10 : 8, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = '#000'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(i === 0 ? 'A' : 'B', p[0], p[1])
      })
    }

    drawLine(line1, line1Direction, '#f59e0b', activeElement === 'line1', 'Line 1', line1WarningDistance)
    drawLine(line2, line2Direction, '#22c55e', activeElement === 'line2', 'Line 2', line2WarningDistance)
  }, [zone, line1, line2, line1Direction, line2Direction, line1WarningDistance, line2WarningDistance, activeElement, thumbnail, imageDimensions])

  // Canvas handlers
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current
    if (!canvas) return [0, 0]
    const rect = canvas.getBoundingClientRect()
    return [Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)), Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))]
  }, [])

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeElement) return
    const [x, y] = getMousePos(e)
    const points = activeElement === 'zone' ? zone : activeElement === 'line1' ? line1 : line2
    for (let i = 0; i < points.length; i++) {
      if (Math.sqrt((x - points[i][0]) ** 2 + (y - points[i][1]) ** 2) < 0.04) { setDraggingIndex(i); return }
    }
    if (activeElement === 'zone') setZone([...zone, [x, y]])
    else if (activeElement === 'line1' && line1.length < 2) setLine1([...line1, [x, y]])
    else if (activeElement === 'line2' && line2.length < 2) setLine2([...line2, [x, y]])
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingIndex === null || !activeElement) return
    const [x, y] = getMousePos(e)
    if (activeElement === 'zone') { const n = [...zone]; n[draggingIndex] = [x, y]; setZone(n) }
    else if (activeElement === 'line1') { const n = [...line1]; n[draggingIndex] = [x, y]; setLine1(n) }
    else { const n = [...line2]; n[draggingIndex] = [x, y]; setLine2(n) }
  }

  const handleCanvasMouseUp = () => setDraggingIndex(null)

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeElement !== 'zone' || zone.length < 4) return
    const [x, y] = getMousePos(e)
    for (let i = 0; i < zone.length; i++) {
      if (Math.sqrt((x - zone[i][0]) ** 2 + (y - zone[i][1]) ** 2) < 0.04) { setZone(zone.filter((_, idx) => idx !== i)); return }
    }
  }

  // Save camera info + inference app
  const handleSaveCamera = async () => {
    setSavingCamera(true)
    setToast(null)
    try {
      // 1. Update camera info
      await updateCamera.mutateAsync({ id: camera.id, data: { name: cameraName, rtsp_url: rtspUrl } })

      // 2. Create/update inference app connection
      if (selectedAppId) {
        const app = apps.find(a => a.id === selectedAppId)
        const existingInference = inferences?.[0]
        const inferenceDisplayName = `${app?.name || selectedAppId} - ${cameraName}`

        if (existingInference) {
          await updateInference.mutateAsync({
            appId: existingInference.appId,
            videoId: camera.id,
            newAppId: selectedAppId,
            uri: rtspUrl,
            name: inferenceDisplayName,
          })
        } else {
          await createInference.mutateAsync({
            appId: selectedAppId,
            videoId: camera.id,
            uri: rtspUrl,
            name: inferenceDisplayName,
            settings: { version: '1.0', configs: [] },
          })
        }
      }

      setToast({ type: 'success', message: '카메라 설정이 저장되었습니다' })
    } catch (err) {
      setToast({ type: 'error', message: '저장 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류') })
    } finally {
      setSavingCamera(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  // Save event settings only (zones, lines) - v2.0 format
  const handleSaveEvent = async () => {
    const existingInference = inferences?.[0]
    const appId = existingInference?.appId || selectedAppId

    if (!appId) {
      setToast({ type: 'error', message: '먼저 카메라 저장에서 Vision App을 연결해주세요' })
      setTimeout(() => setToast(null), 3000)
      return
    }

    setSavingEvent(true)
    setToast(null)
    try {
      const configs: any[] = []

      // ROI config (v2.0)
      if (zone.length >= 3) {
        configs.push({
          eventType: 'ROI',
          eventSettingId: 'roi',
          eventSettingName: '감지 영역',
          points: zone,
          targets: zoneTargets,
        })
      }

      // Line 1 config - 진입 보조 (keypoints: [0] 앞범퍼)
      if (line1.length === 2) {
        configs.push({
          eventType: 'Line',
          eventSettingId: 'line-front',
          eventSettingName: '진입 보조 Line',
          points: line1,
          direction: line1Direction,
          keypoints: [0],
          warningDistance: line1WarningDistance,
          targets: ['RV', 'General'],
        })
      }

      // Line 2 config - 이탈 감지 (keypoints: [1, 2] 앞바퀴, 뒷바퀴)
      if (line2.length === 2) {
        configs.push({
          eventType: 'Line',
          eventSettingId: 'line-side',
          eventSettingName: '이탈 감지 Line',
          points: line2,
          direction: line2Direction,
          keypoints: [1, 2],
          warningDistance: line2WarningDistance,
          targets: ['RV', 'General'],
        })
      }

      const request = { appId, videoId: camera.id, settings: { version: '2.0.0', configs } }
      console.log('[Event Save Request]', JSON.stringify(request, null, 2))
      await updateEventSettings.mutateAsync(request)

      setToast({ type: 'success', message: '이벤트 설정이 저장되었습니다' })
    } catch (err) {
      setToast({ type: 'error', message: '저장 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류') })
    } finally {
      setSavingEvent(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  const applyTemplate = (key: TemplateKey) => {
    const template = CAMERA_TEMPLATES[key]
    setZone(template.zone)
    setLine1(template.line1)
    setLine1Direction(template.line1Direction)
    setLine2(template.line2)
    setLine2Direction(template.line2Direction)
    setLine1WarningDistance(0.03)
    setLine2WarningDistance(0.03)
  }

  const elements = [
    { id: 'zone' as const, label: 'Zone (ROI)', color: 'blue', points: zone, hasPoints: zone.length >= 3 },
    { id: 'line1' as const, label: '진입 보조 Line', color: 'amber', points: line1, hasPoints: line1.length === 2 },
    { id: 'line2' as const, label: '이탈 감지 Line', color: 'green', points: line2, hasPoints: line2.length === 2 },
  ]

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
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-semibold text-white">{camera.name}</h2>
          <p className="text-sm text-gray-500 font-mono">{camera.id}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveCamera}
            disabled={savingCamera}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {savingCamera ? '저장 중...' : '카메라 저장'}
          </button>
          <button
            onClick={handleSaveEvent}
            disabled={savingEvent}
            className="px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {savingEvent ? '저장 중...' : '이벤트 저장'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Preview & Detection */}
          <div className="space-y-6">
            {/* Preview Canvas */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                미리보기 & 탐지 영역
              </h3>
              <div
                className="relative bg-black rounded-xl overflow-hidden"
                style={{
                  aspectRatio: imageDimensions
                    ? `${imageDimensions.width} / ${imageDimensions.height}`
                    : '16 / 9',
                  maxHeight: '60vh'
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={imageDimensions?.width || 640}
                  height={imageDimensions?.height || 360}
                  className="w-full h-full cursor-crosshair"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onDoubleClick={handleCanvasDoubleClick}
                />
                {activeElement && (
                  <div className="absolute top-3 left-3 bg-black/70 px-2 py-1 rounded text-xs text-white">
                    편집: <span className={cn(
                      activeElement === 'zone' && 'text-blue-400',
                      activeElement === 'line1' && 'text-amber-400',
                      activeElement === 'line2' && 'text-green-400',
                    )}>{activeElement === 'zone' ? 'Zone' : activeElement}</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-2 mt-3">
                {/* Template buttons */}
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => applyTemplate('frontRight')}
                    className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white text-xs font-medium transition-colors"
                  >
                    전방우측
                  </button>
                  <button
                    onClick={() => applyTemplate('frontLeft')}
                    className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white text-xs font-medium transition-colors"
                  >
                    전방좌측
                  </button>
                  <button
                    onClick={() => applyTemplate('rearRight')}
                    className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white text-xs font-medium transition-colors"
                  >
                    후방우측
                  </button>
                  <button
                    onClick={() => applyTemplate('rearLeft')}
                    className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white text-xs font-medium transition-colors"
                  >
                    후방좌측
                  </button>
                </div>
                {activeElement && (
                  <button
                    onClick={() => {
                      if (activeElement === 'zone') setZone([])
                      else if (activeElement === 'line1') setLine1([])
                      else setLine2([])
                    }}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 text-sm transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    초기화
                  </button>
                )}
              </div>

              {/* Element Selection */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {elements.map(({ id, label, color, points, hasPoints }) => (
                  <button
                    key={id}
                    onClick={() => setActiveElement(activeElement === id ? null : id)}
                    className={cn(
                      'p-3 rounded-lg border transition-all text-left',
                      activeElement === id
                        ? color === 'blue' ? 'bg-blue-500/20 border-blue-500' : color === 'amber' ? 'bg-amber-500/20 border-amber-500' : 'bg-green-500/20 border-green-500'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn('w-2.5 h-2.5 rounded-full', color === 'blue' && 'bg-blue-500', color === 'amber' && 'bg-amber-500', color === 'green' && 'bg-green-500')} />
                      <span className="text-sm font-medium text-white">{label}</span>
                    </div>
                    <span className={cn('text-xs', hasPoints ? 'text-green-400' : 'text-gray-500')}>
                      {id === 'zone' ? `${points.length}점` : `${points.length}/2`}
                    </span>
                  </button>
                ))}
              </div>

              {/* Zone Settings */}
              {activeElement === 'zone' && (() => {
                // 선택된 앱 또는 기존 inference 앱에서 labels 가져오기
                const appId = selectedAppId || inferences?.[0]?.appId
                const selectedApp = apps.find(a => a.id === appId)
                const availableLabels = selectedApp?.models?.[0]?.labels || []
                const isAllSelected = zoneTargets.includes('ALL')

                return (
                  <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <label className="block text-xs text-gray-400 mb-2">감지 대상</label>
                    {availableLabels.length === 0 ? (
                      <p className="text-xs text-gray-500">Vision App을 먼저 선택해주세요</p>
                    ) : (
                      <div className="space-y-2">
                        {/* ALL 옵션 */}
                        <button
                          onClick={() => {
                            if (isAllSelected) {
                              setZoneTargets([])
                            } else {
                              setZoneTargets(['ALL'])
                            }
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                            isAllSelected
                              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                          )}
                        >
                          <Layers className="h-4 w-4" />
                          <span>전체 선택 (ALL)</span>
                        </button>

                        {/* 개별 labels */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {availableLabels.map((label) => {
                            const { icon: Icon, name } = getLabelInfo(label)
                            const isSelected = !isAllSelected && zoneTargets.includes(label)
                            return (
                              <button
                                key={label}
                                onClick={() => {
                                  if (isAllSelected) {
                                    // ALL 해제하고 이 label만 선택
                                    setZoneTargets([label])
                                  } else if (isSelected) {
                                    setZoneTargets(zoneTargets.filter(t => t !== label))
                                  } else {
                                    setZoneTargets([...zoneTargets, label])
                                  }
                                }}
                                disabled={isAllSelected}
                                className={cn(
                                  'flex items-center gap-2 px-2.5 py-2 text-xs font-medium rounded-lg border transition-all',
                                  isAllSelected
                                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400/60 cursor-not-allowed'
                                    : isSelected
                                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                <span>{name}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Line 1 Settings (진입 보조) */}
              {activeElement === 'line1' && (
                <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-amber-500/30 space-y-4">
                  <div className="text-xs text-amber-400 font-medium">키포인트: 앞범퍼 [0]</div>

                  {/* Direction */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">방향</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['A2B', 'B2A'] as const).map((dir) => (
                        <button
                          key={dir}
                          onClick={() => setLine1Direction(dir)}
                          className={cn(
                            'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                            line1Direction === dir
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                          )}
                        >
                          {dir === 'A2B' ? 'A → B' : 'B → A'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Warning Distance */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-gray-400">
                        Warning 거리: {(line1WarningDistance * 100).toFixed(1)}%
                      </label>
                      <button
                        onClick={() => setLine1WarningDistance(0.03)}
                        className="text-xs text-gray-500 hover:text-gray-300"
                      >
                        기본값 (3%)
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={line1WarningDistance * 100}
                      onChange={(e) => setLine1WarningDistance(Number(e.target.value) / 100)}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  {/* Fixed Target Labels */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">감지 대상 (고정)</label>
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 border border-amber-500 text-amber-400">RV</span>
                      <span className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 border border-amber-500 text-amber-400">General</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Line 2 Settings (이탈 감지) */}
              {activeElement === 'line2' && (
                <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-green-500/30 space-y-4">
                  <div className="text-xs text-green-400 font-medium">키포인트: 앞바퀴, 뒷바퀴 [1, 2]</div>

                  {/* Direction */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">방향</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['A2B', 'B2A'] as const).map((dir) => (
                        <button
                          key={dir}
                          onClick={() => setLine2Direction(dir)}
                          className={cn(
                            'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                            line2Direction === dir
                              ? 'bg-green-500/20 border-green-500 text-green-400'
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                          )}
                        >
                          {dir === 'A2B' ? 'A → B' : 'B → A'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Warning Distance */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-gray-400">
                        Warning 거리: {(line2WarningDistance * 100).toFixed(1)}%
                      </label>
                      <button
                        onClick={() => setLine2WarningDistance(0.03)}
                        className="text-xs text-gray-500 hover:text-gray-300"
                      >
                        기본값 (3%)
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={line2WarningDistance * 100}
                      onChange={(e) => setLine2WarningDistance(Number(e.target.value) / 100)}
                      className="w-full accent-green-500"
                    />
                  </div>

                  {/* Fixed Target Labels */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">감지 대상 (고정)</label>
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 border border-green-500 text-green-400">RV</span>
                      <span className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 border border-green-500 text-green-400">General</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* Camera Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                카메라 정보
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">카메라 이름</label>
                  <input
                    value={cameraName}
                    onChange={(e) => setCameraName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">RTSP URL</label>
                  <input
                    value={rtspUrl}
                    onChange={(e) => setRtspUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Vision App */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Vision App 연결
              </h3>
              <div className="relative">
                <select
                  value={selectedAppId || ''}
                  onChange={(e) => setSelectedAppId(e.target.value || null)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="">선택 안함</option>
                  {apps.map((app) => (
                    <option key={app.id} value={app.id}>{app.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
