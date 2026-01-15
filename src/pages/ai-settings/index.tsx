import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Camera, RefreshCw, Video, Save,
  RotateCcw, Layers, Maximize2, X, ZoomIn, ZoomOut, Settings2,
  Car, Truck, Bus, Bike, User, Dog, Cat, CircleDot, type LucideIcon, Brain
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { connect, StringCodec } from 'nats.ws'
import type { NatsConnection } from 'nats.ws'
import { useCameras, useSyncCameras } from '@features/camera'
import { useApps } from '@features/app'
import { useInferencesByVideo, useUpdateEventSettings } from '@features/inference'
import {
  usePlcCameraSettings,
  usePlcCameraEvents,
  useUpdatePlcCameraEvent,
  usePlcAvailableEvents,
} from '@features/plc'
import { cn } from '@shared/lib/cn'
import type { Camera as CameraType, App } from '@shared/types'

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
  // 전방 우측 (cam2)
  frontRight: {
    zone: [[0, 0.9262], [0.0059, 0.092], [0.996, 0.181], [0.984, 0.9985]] as [number, number][],
    line1: [[0, 0.7293], [0.5192, 0.8722]] as [number, number][],
    line1Direction: 'A2B' as const,
    line1WarningDistance: 0,
    line2: [[0.8583, 0.3043], [0.4908, 0.8976]] as [number, number][],
    line2Direction: 'B2A' as const,
    line2WarningDistance: 0.03,
  },
  // 전방 좌측 (cam2)
  frontLeft: {
    zone: [[0.05, 0.05], [0.95, 0.02], [0.75, 0.90], [0.15, 0.94]] as [number, number][],
    line1: [[0.12, 0.30], [0.61, 0.99]] as [number, number][],
    line1Direction: 'A2B' as const,
    line1WarningDistance: 0,
    line2: [[0.34, 0.92], [0.99, 0.72]] as [number, number][],
    line2Direction: 'A2B' as const,
    line2WarningDistance: 0.03,
  },
  // 후방 우측 (cam3)
  rearRight: {
    zone: [[0.0096, 0.0152], [0.9843, 0.0198], [0.9654, 0.9757], [0.015, 0.9825]] as [number, number][],
    line1: [[0.5368, 0.2228], [0.8951, 0.2532]] as [number, number][],
    line1Direction: 'B2A' as const,
    line1WarningDistance: 0.03,
    line2: [[0.841, 0.2479], [0.3151, 0.8844]] as [number, number][],
    line2Direction: 'B2A' as const,
    line2WarningDistance: 0.03,
  },
  // 후방 좌측 (cam5)
  rearLeft: {
    zone: [[0.15, 0.10], [0.85, 0.06], [0.95, 0.98], [0.05, 0.95]] as [number, number][],
    line1: [[0.12, 0.70], [0.61, 0.01]] as [number, number][],
    line1Direction: 'B2A' as const,
    line1WarningDistance: 0,
    line2: [[0.34, 0.08], [0.99, 0.28]] as [number, number][],
    line2Direction: 'B2A' as const,
    line2WarningDistance: 0.03,
  },
}

type TemplateKey = keyof typeof CAMERA_TEMPLATES

type ActiveElement = 'zone' | 'line1' | 'line2' | null

export function AiSettingsPage() {
  const { data: cameras, isLoading, refetch } = useCameras()
  const { data: apps } = useApps()
  const syncCameras = useSyncCameras()

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)

  // Select first camera on load
  useEffect(() => {
    if (cameras && cameras.length > 0 && !selectedCameraId) {
      setSelectedCameraId(cameras[0].id)
    }
  }, [cameras, selectedCameraId])

  const selectedCamera = cameras?.find(c => c.id === selectedCameraId) || null

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Camera List */}
      <div className="w-56 border-r flex flex-col bg-muted/30">
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI 설정
            </h2>
            <button
              onClick={async () => { await syncCameras.mutateAsync(); refetch() }}
              disabled={syncCameras.isPending}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              title="동기화"
            >
              <RefreshCw className={cn('h-4 w-4', syncCameras.isPending && 'animate-spin')} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{cameras?.length || 0}개의 카메라</p>
        </div>

        {/* Camera List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
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
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      camera.is_active ? 'bg-green-500' : 'bg-gray-400'
                    )} />
                    <span className="text-sm font-medium truncate">{camera.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1 font-mono">{camera.id}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Video className="h-10 w-10 mb-3" />
              <p className="text-sm">카메라 없음</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Content - Settings Panel */}
      <div className="flex-1 overflow-hidden">
        {selectedCamera ? (
          <AiSettingsPanel
            camera={selectedCamera}
            apps={apps || []}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Camera className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">카메라를 선택하세요</p>
            <p className="text-sm mt-1">왼쪽 목록에서 카메라를 선택하면 AI 설정을 변경할 수 있습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}

// AI Settings Panel Component
interface AiSettingsPanelProps {
  camera: CameraType
  apps: App[]
}

function AiSettingsPanel({ camera, apps }: AiSettingsPanelProps) {
  // Detection preview
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)

  // Resizer state
  const [previewWidth, setPreviewWidth] = useState(50) // percentage
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // PLC section expand state
  const [plcExpanded, setPlcExpanded] = useState(false)

  // Detection elements - Zone (ROI)
  const [zone, setZone] = useState<[number, number][]>([])
  const [zoneTargets, setZoneTargets] = useState<string[]>(['ALL'])

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
  const [savingEvent, setSavingEvent] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const ncRef = useRef<NatsConnection | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  // Hooks
  const { data: inferences } = useInferencesByVideo(camera.id)
  const updateEventSettings = useUpdateEventSettings()

  // Current connected app
  const connectedInference = inferences?.[0]
  const connectedAppId = connectedInference?.appId

  // Reset settings when camera changes
  useEffect(() => {
    setActiveElement(null)
    // Reset zone
    setZone([])
    setZoneTargets(['ALL'])
    // Reset line 1
    setLine1([])
    setLine1Direction('A2B')
    setLine1WarningDistance(0.03)
    // Reset line 2
    setLine2([])
    setLine2Direction('A2B')
    setLine2WarningDistance(0.03)
    setThumbnail(null)
    setImageDimensions(null)
    imageRef.current = null
  }, [camera.id])

  // Load inference settings
  useEffect(() => {
    if (!inferences) return
    const existingInference = inferences[0]
    if (existingInference) {
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
      const isOtherActive = activeElement !== null && activeElement !== 'zone'
      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
      if (zone.length > 2) ctx.closePath()
      ctx.fillStyle = isActive ? 'rgba(59, 130, 246, 0.3)' : isOtherActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)'
      ctx.fill()
      ctx.strokeStyle = isActive ? '#3b82f6' : isOtherActive ? '#3b82f680' : '#3b82f6aa'
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
      warningDist: number,
      isOtherActive: boolean
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
          ctx.fillStyle = color + '30' // Use line color with alpha for warning zone
          ctx.fill()
          ctx.strokeStyle = color + '60'
          ctx.lineWidth = 1
          ctx.setLineDash([4, 4])
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Draw main line
        ctx.beginPath()
        ctx.moveTo(p1[0], p1[1])
        ctx.lineTo(p2[0], p2[1])
        ctx.strokeStyle = isActive ? color : isOtherActive ? color + '80' : color + 'aa'
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

    const isLine1Active = activeElement === 'line1'
    const isLine2Active = activeElement === 'line2'
    const isAnyActive = activeElement !== null
    drawLine(line1, line1Direction, '#f59e0b', isLine1Active, 'Line 1', line1WarningDistance, isAnyActive && !isLine1Active)
    drawLine(line2, line2Direction, '#22c55e', isLine2Active, 'Line 2', line2WarningDistance, isAnyActive && !isLine2Active)
  }, [zone, line1, line2, line1Direction, line2Direction, line1WarningDistance, line2WarningDistance, activeElement, thumbnail, imageDimensions])

  // Canvas handlers - account for object-contain scaling
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current
    if (!canvas) return [0, 0]
    const rect = canvas.getBoundingClientRect()

    // Calculate actual rendered size considering object-contain
    const canvasAspect = canvas.width / canvas.height
    const rectAspect = rect.width / rect.height

    let renderWidth = rect.width
    let renderHeight = rect.height
    let offsetX = 0
    let offsetY = 0

    if (canvasAspect > rectAspect) {
      // Canvas is wider - letterbox top/bottom
      renderHeight = rect.width / canvasAspect
      offsetY = (rect.height - renderHeight) / 2
    } else {
      // Canvas is taller - letterbox left/right
      renderWidth = rect.height * canvasAspect
      offsetX = (rect.width - renderWidth) / 2
    }

    const x = (e.clientX - rect.left - offsetX) / renderWidth
    const y = (e.clientY - rect.top - offsetY) / renderHeight

    return [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))]
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

  const handleCanvasContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (activeElement !== 'zone' || zone.length < 4) return
    const [x, y] = getMousePos(e)
    for (let i = 0; i < zone.length; i++) {
      if (Math.sqrt((x - zone[i][0]) ** 2 + (y - zone[i][1]) ** 2) < 0.06) { setZone(zone.filter((_, idx) => idx !== i)); return }
    }
  }

  // Resizer handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = (x / rect.width) * 100
      // Limit between 25% and 75%
      setPreviewWidth(Math.max(25, Math.min(75, percentage)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // Save event settings only (zones, lines) - v2.0 format
  const handleSaveEvent = async () => {
    if (!connectedAppId) {
      setToast({ type: 'error', message: '먼저 Vision App을 연결해주세요' })
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

      const request = { appId: connectedAppId, videoId: camera.id, settings: { version: '2.0.0', configs } }
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
    setLine1WarningDistance(template.line1WarningDistance)
    setLine2(template.line2)
    setLine2Direction(template.line2Direction)
    setLine2WarningDistance(template.line2WarningDistance)
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

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        <div ref={containerRef} className="h-full flex gap-0 relative">
          {/* Left Column - Preview */}
          <div
            className="flex items-start justify-center h-full overflow-hidden pr-2"
            style={{ width: `${previewWidth}%` }}
          >
            <div
              className="relative bg-black rounded-xl overflow-hidden"
              style={{
                aspectRatio: imageDimensions
                  ? `${imageDimensions.width} / ${imageDimensions.height}`
                  : '9 / 16',
                maxHeight: '100%',
                width: 'auto',
                height: '100%',
              }}
            >
              <canvas
                ref={canvasRef}
                width={imageDimensions?.width || 720}
                height={imageDimensions?.height || 1280}
                className="w-full h-full cursor-crosshair object-contain"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onContextMenu={handleCanvasContextMenu}
              />
              {activeElement && (
                <div className="absolute top-3 left-3 bg-black/70 px-2 py-1 rounded text-xs text-white">
                  편집: <span className={cn(
                    activeElement === 'zone' && 'text-blue-400',
                    activeElement === 'line1' && 'text-amber-400',
                    activeElement === 'line2' && 'text-green-400',
                  )}>{activeElement === 'zone' ? 'Zone' : activeElement}</span>
                  {activeElement === 'zone' && zone.length >= 4 && (
                    <span className="text-gray-400 ml-2">• 우클릭으로 점 삭제</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Resize Handle */}
          <div
            onMouseDown={handleResizeStart}
            className={cn(
              'w-2 cursor-col-resize flex items-center justify-center group shrink-0 z-10',
              isResizing && 'bg-primary/10'
            )}
          >
            <div className={cn(
              'w-1 h-16 rounded-full bg-border transition-colors',
              'group-hover:bg-primary/50',
              isResizing && 'bg-primary'
            )} />
          </div>

          {/* Right Column - All Settings */}
          <div
            className="overflow-y-auto space-y-4 pl-2"
            style={{ width: `${100 - previewWidth}%` }}
          >
            {/* Save Button */}
            <button
              onClick={handleSaveEvent}
              disabled={savingEvent}
              className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {savingEvent ? '저장 중...' : '이벤트 저장'}
            </button>

            {/* Vision App (Read-only - 카메라 설정에서 변경) */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Vision App</h3>
              {connectedAppId ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-300 rounded-lg">
                  <Layers className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {apps.find(a => a.id === connectedAppId)?.name || connectedAppId}
                  </span>
                </div>
              ) : (
                <div className="px-3 py-2 bg-muted border rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    연결된 Vision App이 없습니다.
                    <br />
                    <span className="text-[10px]">카메라 설정에서 Vision App을 연결해주세요.</span>
                  </p>
                </div>
              )}
            </div>

            {/* Template Buttons */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2">템플릿</h3>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => applyTemplate('frontRight')}
                  className="px-2 py-1.5 bg-muted hover:bg-muted/80 border rounded text-xs transition-colors"
                >
                  전방우측
                </button>
                <button
                  onClick={() => applyTemplate('frontLeft')}
                  className="px-2 py-1.5 bg-muted hover:bg-muted/80 border rounded text-xs transition-colors"
                >
                  전방좌측
                </button>
                <button
                  onClick={() => applyTemplate('rearRight')}
                  className="px-2 py-1.5 bg-muted hover:bg-muted/80 border rounded text-xs transition-colors"
                >
                  후방우측
                </button>
                <button
                  onClick={() => applyTemplate('rearLeft')}
                  className="px-2 py-1.5 bg-muted hover:bg-muted/80 border rounded text-xs transition-colors"
                >
                  후방좌측
                </button>
              </div>
            </div>

            {/* Element Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-muted-foreground">탐지 요소</h3>
                {activeElement && (
                  <button
                    onClick={() => {
                      if (activeElement === 'zone') setZone([])
                      else if (activeElement === 'line1') setLine1([])
                      else setLine2([])
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    초기화
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {elements.map(({ id, label, color, points, hasPoints }) => {
                  const isActive = activeElement === id
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveElement(isActive ? null : id)}
                      className={cn(
                        'relative p-3 rounded-xl border-2 transition-all text-center group',
                        isActive
                          ? ''
                          : 'bg-muted/50 border-transparent hover:border-muted-foreground/30'
                      )}
                      style={{
                        borderColor: isActive
                          ? color === 'blue' ? '#3b82f6' : color === 'amber' ? '#f59e0b' : '#22c55e'
                          : undefined,
                        backgroundColor: isActive
                          ? color === 'blue' ? 'rgba(59,130,246,0.1)' : color === 'amber' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)'
                          : undefined
                      }}
                    >
                      {/* Status dot */}
                      <div
                        className={cn(
                          'absolute top-2 right-2 w-2 h-2 rounded-full transition-all',
                          hasPoints ? 'bg-green-500' : 'bg-gray-300'
                        )}
                      />
                      {/* Icon */}
                      <div
                        className={cn(
                          'w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center transition-all',
                          isActive ? 'scale-110' : 'group-hover:scale-105'
                        )}
                        style={{
                          backgroundColor: color === 'blue' ? 'rgba(59,130,246,0.15)' : color === 'amber' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)'
                        }}
                      >
                        {id === 'zone' ? (
                          <svg className="w-4 h-4" style={{ color: color === 'blue' ? '#3b82f6' : color === 'amber' ? '#f59e0b' : '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" style={{ color: color === 'blue' ? '#3b82f6' : color === 'amber' ? '#f59e0b' : '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20L20 4" />
                          </svg>
                        )}
                      </div>
                      {/* Label */}
                      <p className={cn(
                        'text-[11px] font-medium mb-0.5',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {id === 'zone' ? 'Zone' : id === 'line1' ? 'Line 1' : 'Line 2'}
                      </p>
                      {/* Points count */}
                      <p className={cn(
                        'text-[10px]',
                        hasPoints ? 'text-green-600' : 'text-muted-foreground'
                      )}>
                        {id === 'zone' ? `${points.length}점` : `${points.length}/2`}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Zone Settings */}
            {activeElement === 'zone' && (() => {
              const selectedApp = apps.find(a => a.id === connectedAppId)
              const availableLabels = selectedApp?.models?.[0]?.labels || []
              const isAllSelected = zoneTargets.includes('ALL')

              return (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block text-xs text-muted-foreground mb-2">감지 대상</label>
                  {availableLabels.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Vision App을 먼저 선택해주세요</p>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => setZoneTargets(isAllSelected ? [] : ['ALL'])}
                        className={cn(
                          'w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all',
                          isAllSelected
                            ? 'bg-blue-100 border-blue-500 text-blue-600'
                            : 'bg-white border text-muted-foreground hover:border-blue-300'
                        )}
                      >
                        <Layers className="h-3 w-3" />
                        전체 선택 (ALL)
                      </button>
                      <div className="grid grid-cols-2 gap-1">
                        {availableLabels.map((label) => {
                          const { icon: Icon, name } = getLabelInfo(label)
                          const isSelected = !isAllSelected && zoneTargets.includes(label)
                          return (
                            <button
                              key={label}
                              onClick={() => {
                                if (isAllSelected) setZoneTargets([label])
                                else if (isSelected) setZoneTargets(zoneTargets.filter(t => t !== label))
                                else setZoneTargets([...zoneTargets, label])
                              }}
                              disabled={isAllSelected}
                              className={cn(
                                'flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-lg border transition-all',
                                isAllSelected
                                  ? 'bg-blue-50 border-blue-200 text-blue-400 cursor-not-allowed'
                                  : isSelected
                                    ? 'bg-blue-100 border-blue-500 text-blue-600'
                                    : 'bg-white border text-muted-foreground hover:border-blue-300'
                              )}
                            >
                              <Icon className="h-3 w-3" />
                              {name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Line 1 Settings */}
            {activeElement === 'line1' && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                <div className="text-xs text-amber-600 font-medium">키포인트: 앞범퍼 [0]</div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">방향</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['A2B', 'B2A'] as const).map((dir) => (
                      <button
                        key={dir}
                        onClick={() => setLine1Direction(dir)}
                        className={cn(
                          'px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all',
                          line1Direction === dir
                            ? 'bg-amber-100 border-amber-500 text-amber-600'
                            : 'bg-white border text-muted-foreground hover:border-amber-300'
                        )}
                      >
                        {dir === 'A2B' ? 'A → B' : 'B → A'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground">Warning: {(line1WarningDistance * 100).toFixed(0)}%</label>
                    <button onClick={() => setLine1WarningDistance(0.03)} className="text-[10px] text-muted-foreground hover:text-foreground">기본값</button>
                  </div>
                  <input type="range" min="0" max="10" step="0.5" value={line1WarningDistance * 100} onChange={(e) => setLine1WarningDistance(Number(e.target.value) / 100)} className="w-full accent-amber-500" />
                </div>
              </div>
            )}

            {/* Line 2 Settings */}
            {activeElement === 'line2' && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200 space-y-3">
                <div className="text-xs text-green-600 font-medium">키포인트: 앞바퀴, 뒷바퀴 [1, 2]</div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">방향</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['A2B', 'B2A'] as const).map((dir) => (
                      <button
                        key={dir}
                        onClick={() => setLine2Direction(dir)}
                        className={cn(
                          'px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all',
                          line2Direction === dir
                            ? 'bg-green-100 border-green-500 text-green-600'
                            : 'bg-white border text-muted-foreground hover:border-green-300'
                        )}
                      >
                        {dir === 'A2B' ? 'A → B' : 'B → A'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground">Warning: {(line2WarningDistance * 100).toFixed(0)}%</label>
                    <button onClick={() => setLine2WarningDistance(0.03)} className="text-[10px] text-muted-foreground hover:text-foreground">기본값</button>
                  </div>
                  <input type="range" min="0" max="10" step="0.5" value={line2WarningDistance * 100} onChange={(e) => setLine2WarningDistance(Number(e.target.value) / 100)} className="w-full accent-green-500" />
                </div>
              </div>
            )}

            {/* PLC Event Settings */}
            <PlcEventSettingsSection
              cameraId={camera.id}
              isExpanded={plcExpanded}
              onToggleExpand={() => setPlcExpanded(!plcExpanded)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// PLC Event Settings Section
// =============================================================================

// 비트 범위 (0 ~ F, 16진수)
const BIT_RANGE = Array.from({ length: 16 }, (_, i) => i)
const BIT_HEX = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']

// 동적 주소 범위 생성
function generateAddressRange(baseAddress: string, wordCount: number): string[] {
  const match = baseAddress.match(/D0*(\d+)/)
  if (!match) return []
  const baseNum = parseInt(match[1], 10)
  const addresses: string[] = []
  for (let i = 0; i < wordCount; i++) {
    addresses.push(`D${String(baseNum + i).padStart(7, '0')}`)
  }
  return addresses
}

// PLC 이벤트 라벨 한글 매핑 (화면에는 한글, API에는 영어)
const PLC_EVENT_LABELS: Record<string, string> = {
  'RV': 'RV',
  'General': '승용차',
  'Pickup': '픽업트럭',
  'Mirror_on': '미러 열림',
  'Mirror_off': '미러 닫힘',
  'Opened_door': '문 열림',
  'Carrier': '캐리어',
  'Roof_box': '루프박스',
  'Shark_antenna': '샤크안테나',
  'Pole_antenna': '폴안테나',
  'Warning_light': '경고등',
  'Emblem': '엠블럼',
  'Taxi_light': '택시등',
  'Person': '사람',
  'approach-line-front': '전방 접근',
  'crossing-line-front': '전방 이탈',
  'approach-line-side': '측면 접근',
  'crossing-line-side': '측면 이탈',
}

// 영어 이벤트 타입을 한글 라벨로 변환
function getKoreanLabel(eventType: string): string {
  return PLC_EVENT_LABELS[eventType] || eventType
}

// 라벨별 색상
const LABEL_COLOR_PALETTE = [
  'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
  'bg-orange-500', 'bg-red-500', 'bg-pink-500', 'bg-cyan-500',
  'bg-teal-500', 'bg-indigo-500', 'bg-rose-500', 'bg-amber-500',
]

function getLabelColor(label: string): string {
  let hash = 0
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash)
  }
  return LABEL_COLOR_PALETTE[Math.abs(hash) % LABEL_COLOR_PALETTE.length]
}

// cameraSettings 정규화
function normalizeCameraSettings(settings: any) {
  if (!settings) return null
  return {
    baseAddress: settings.base_address || settings.baseAddress || '',
    wordCount: settings.word_count ?? settings.wordCount ?? 0,
  }
}

// event 정규화
function normalizeEvent(event: any) {
  return {
    eventType: event.eventType || event.event_type || '',
    label: event.label || '',
    address: event.address || '',
    bit: event.bit,
    enabled: event.enabled ?? true,
  }
}

interface PlcEventSettingsSectionProps {
  cameraId: string
  isExpanded: boolean
  onToggleExpand: () => void
}

function PlcEventSettingsSection({ cameraId, isExpanded, onToggleExpand }: PlcEventSettingsSectionProps) {
  const navigate = useNavigate()
  const [draggedLabel, setDraggedLabel] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ address: string; bit: number } | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [cellSize, setCellSize] = useState(100) // 모달 셀 너비 (px)

  // PLC data
  const { data: rawCameraSettings } = usePlcCameraSettings(cameraId)
  const { data: rawEvents, refetch } = usePlcCameraEvents(cameraId)
  const { data: availableEventsData } = usePlcAvailableEvents(cameraId)
  const updateEvent = useUpdatePlcCameraEvent()

  // Normalize data
  const cameraSettings = useMemo(() => normalizeCameraSettings(rawCameraSettings), [rawCameraSettings])
  const events = useMemo(() => rawEvents?.map(normalizeEvent) || [], [rawEvents])

  // Address range
  const addressRange = useMemo(() => {
    if (!cameraSettings?.baseAddress || !cameraSettings?.wordCount) return []
    return generateAddressRange(cameraSettings.baseAddress, cameraSettings.wordCount)
  }, [cameraSettings?.baseAddress, cameraSettings?.wordCount])

  // Available events from API
  const availableLabels = availableEventsData?.events || []

  // Unplaced labels
  const unplacedLabels = useMemo(() => {
    const placedEventTypes = events.filter(e => e.bit !== null).map(e => e.eventType)
    return availableLabels.filter(label => !placedEventTypes.includes(label))
  }, [availableLabels, events])

  // Get event at position
  const getEventAt = (address: string, bit: number) => {
    return events.find(e => e.address === address && e.bit === bit)
  }

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, label: string) => {
    setDraggedLabel(label)
    e.dataTransfer.setData('text/plain', label)
  }

  const handleDragEnd = () => {
    setDraggedLabel(null)
    setDropTarget(null)
  }

  const handleDragOver = (e: React.DragEvent, address: string, bit: number) => {
    // 이미 이벤트가 있는 셀에는 드롭 불가
    const existingEvent = getEventAt(address, bit)
    if (existingEvent) return

    e.preventDefault()
    setDropTarget({ address, bit })
  }

  const handleDragLeave = () => {
    setDropTarget(null)
  }

  const handleDrop = async (e: React.DragEvent, address: string, bit: number) => {
    e.preventDefault()
    const label = e.dataTransfer.getData('text/plain')
    if (!label) return

    // 이미 이벤트가 있는 셀에는 드롭 불가
    const existingEvent = getEventAt(address, bit)
    if (existingEvent) {
      setDropTarget(null)
      setDraggedLabel(null)
      return
    }

    setDropTarget(null)
    setDraggedLabel(null)
    setSaveStatus('saving')

    try {
      await updateEvent.mutateAsync({
        cameraId,
        eventType: label,
        data: { address, bit, label },
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1500)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const handleRemoveFromCell = async (label: string) => {
    setSaveStatus('saving')
    try {
      await updateEvent.mutateAsync({
        cameraId,
        eventType: label,
        data: { bit: null },
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1500)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  // No PLC settings
  if (!cameraSettings || addressRange.length === 0) {
    return (
      <div className="mt-4 pt-4 border-t">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">PLC 이벤트 설정</h3>
        <div className="p-3 bg-muted rounded-lg text-center">
          <p className="text-xs text-muted-foreground">
            PLC 설정이 없습니다.
            <br />
            <span className="text-[10px]">PLC 페이지에서 설정을 먼저 완료해주세요.</span>
          </p>
        </div>
      </div>
    )
  }

  // 인라인 셀 크기 (너비 넓게, 높이는 적당히)
  const inlineCellWidth = 72
  const inlineCellHeight = 32

  // 그리드 렌더링 함수 (인라인과 모달에서 공유)
  const renderGrid = (inModal: boolean) => {
    const cellWidth = inModal ? cellSize : inlineCellWidth
    const cellHeight = inModal ? cellSize * 0.4 : inlineCellHeight // 모달은 높이를 너비의 40%로
    const fontSize = inModal ? Math.max(12, cellSize / 6) : 12
    const labelFontSize = inModal ? Math.max(11, cellSize / 8) : 11

    return (
      <div className={cn(
        'overflow-x-auto',
        inModal && 'overflow-y-auto flex-1'
      )}>
        <table className="border-collapse" style={{ fontSize: `${fontSize}px` }}>
          <thead className="sticky top-0 bg-zinc-700 text-zinc-300 z-10">
            <tr>
              <th
                className="text-left font-medium border-r border-zinc-600 sticky left-0 bg-zinc-700 z-20"
                style={{ padding: inModal ? '8px 12px' : '6px 10px', minWidth: inModal ? '80px' : '64px' }}
              >
                ADDR
              </th>
              {BIT_RANGE.map(bit => (
                <th
                  key={bit}
                  className="text-center font-medium border-r border-zinc-600"
                  style={{
                    padding: inModal ? '8px 4px' : '6px 4px',
                    width: `${cellWidth}px`,
                    minWidth: `${cellWidth}px`
                  }}
                >
                  {BIT_HEX[bit]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {addressRange.map((address) => (
              <tr key={address} className="border-b border-zinc-200">
                <td
                  className="font-mono bg-zinc-100 border-r sticky left-0 z-10"
                  style={{ padding: inModal ? '4px 12px' : '4px 10px', fontSize: inModal ? `${fontSize - 1}px` : '10px' }}
                >
                  {address.replace('D000', 'D')}
                </td>
                {BIT_RANGE.map(bit => {
                  const event = getEventAt(address, bit)
                  const isDropTargetCell = dropTarget?.address === address && dropTarget?.bit === bit

                  return (
                    <td
                      key={bit}
                      onDragOver={(e) => handleDragOver(e, address, bit)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, address, bit)}
                      className={cn(
                        'text-center border-r border-zinc-200',
                        isDropTargetCell && 'bg-primary/30 ring-1 ring-primary ring-inset',
                        !event && !isDropTargetCell && 'bg-zinc-50 hover:bg-zinc-100'
                      )}
                      style={{
                        padding: '4px',
                        height: `${cellHeight}px`,
                        width: `${cellWidth}px`,
                        minWidth: `${cellWidth}px`
                      }}
                    >
                      {event ? (
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, event.eventType)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleRemoveFromCell(event.eventType)}
                          className={cn(
                            'rounded font-bold text-white cursor-pointer truncate h-full flex items-center justify-center',
                            getLabelColor(event.eventType),
                            draggedLabel === event.eventType && 'opacity-50'
                          )}
                          style={{ fontSize: `${labelFontSize}px`, padding: '2px' }}
                          title={`${getKoreanLabel(event.eventType)} (클릭하여 제거)`}
                        >
                          {getKoreanLabel(event.eventType)}
                        </div>
                      ) : (
                        <span className="text-zinc-300">-</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // 라벨 목록 렌더링 함수
  const renderLabels = (inModal: boolean) => (
    <div className={inModal ? 'mb-4' : 'mb-2'}>
      <div className={cn('text-muted-foreground mb-1.5', inModal ? 'text-xs' : 'text-[10px]')}>
        미배치 라벨 ({unplacedLabels.length})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {unplacedLabels.map((label) => (
          <div
            key={label}
            draggable
            onDragStart={(e) => handleDragStart(e, label)}
            onDragEnd={handleDragEnd}
            className={cn(
              'rounded font-medium cursor-grab active:cursor-grabbing text-white',
              getLabelColor(label),
              draggedLabel === label && 'opacity-50',
              inModal ? 'px-3 py-1.5 text-sm' : 'px-1.5 py-0.5 text-[10px]'
            )}
            title={label}
          >
            {getKoreanLabel(label)}
          </div>
        ))}
        {unplacedLabels.length === 0 && availableLabels.length > 0 && (
          <span className={cn('text-muted-foreground', inModal ? 'text-sm' : 'text-[10px]')}>모두 배치됨</span>
        )}
        {availableLabels.length === 0 && (
          <span className={cn('text-muted-foreground', inModal ? 'text-sm' : 'text-[10px]')}>Vision App을 연결해주세요</span>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* 인라인 미리보기 */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-medium text-muted-foreground">PLC 이벤트 설정</h3>
            <button
              onClick={onToggleExpand}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="크게 보기"
            >
              <Maximize2 className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus !== 'idle' && (
              <span className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded',
                saveStatus === 'saving' && 'bg-blue-100 text-blue-600',
                saveStatus === 'saved' && 'bg-green-100 text-green-600',
                saveStatus === 'error' && 'bg-red-100 text-red-600'
              )}>
                {saveStatus === 'saving' && '저장 중...'}
                {saveStatus === 'saved' && '저장됨'}
                {saveStatus === 'error' && '오류'}
              </span>
            )}
            <button
              onClick={() => navigate('/plc')}
              className="text-[10px] px-2 py-1 bg-muted hover:bg-muted/80 rounded flex items-center gap-1 transition-colors"
            >
              <Settings2 className="h-3 w-3" />
              연결 설정
            </button>
          </div>
        </div>

        {renderLabels(false)}

        {/* 인라인 그리드 */}
        <div className="border rounded-lg overflow-hidden">
          <div className="px-2 py-1.5 bg-zinc-800 text-zinc-300 text-[11px] font-medium flex items-center justify-between">
            <span>Bit Grid ({cameraSettings.baseAddress} ~ {addressRange.length}개)</span>
            <span className="text-zinc-500 text-[10px]">← 좌우 스크롤 →</span>
          </div>
          {renderGrid(false)}
        </div>
      </div>

      {/* 모달 팝업 */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onToggleExpand}>
          <div
            className="bg-background rounded-xl shadow-2xl w-[90vw] h-[85vh] max-w-6xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">PLC 이벤트 설정</h2>
                <span className="text-sm text-muted-foreground">
                  {cameraSettings.baseAddress} ~ {addressRange.length}개 주소
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* 줌 컨트롤 */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                  <button
                    onClick={() => setCellSize(Math.max(60, cellSize - 20))}
                    className="p-1 hover:bg-background rounded transition-colors"
                    title="축소"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-medium w-12 text-center">{cellSize}px</span>
                  <button
                    onClick={() => setCellSize(Math.min(150, cellSize + 20))}
                    className="p-1 hover:bg-background rounded transition-colors"
                    title="확대"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
                {saveStatus !== 'idle' && (
                  <span className={cn(
                    'text-xs font-medium px-2 py-1 rounded',
                    saveStatus === 'saving' && 'bg-blue-100 text-blue-600',
                    saveStatus === 'saved' && 'bg-green-100 text-green-600',
                    saveStatus === 'error' && 'bg-red-100 text-red-600'
                  )}>
                    {saveStatus === 'saving' && '저장 중...'}
                    {saveStatus === 'saved' && '저장됨'}
                    {saveStatus === 'error' && '오류'}
                  </span>
                )}
                <button
                  onClick={onToggleExpand}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 모달 내용 */}
            <div className="flex-1 overflow-hidden p-6 flex flex-col">
              {renderLabels(true)}

              {/* 모달 그리드 */}
              <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
                <div className="px-4 py-2 bg-zinc-800 text-zinc-300 text-sm font-medium shrink-0">
                  Bit Grid (16진수: 0-F)
                </div>
                {renderGrid(true)}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
