import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Save, ChevronDown, RotateCcw, Square, Tag, Hash, Percent, Activity, Layers, Camera, Eye } from 'lucide-react'
import { connect, StringCodec } from 'nats.ws'
import type { NatsConnection } from 'nats.ws'
import { useInferencesByVideo, useCreateInference, useUpdateInference, useUpdateEventSettings } from '@features/inference'
import { useUpdateCamera, useCameraStore, type CameraDisplaySettings, defaultDisplaySettings } from '@features/camera'
import { cn } from '@shared/lib/cn'
import type { Camera as CameraType } from '@shared/types'

interface CameraSettingsDialogProps {
  isOpen: boolean
  camera: CameraType | null
  apps: { id: string; name: string }[]
  onClose: () => void
}

// 기본 템플릿 설정
const DEFAULT_TEMPLATE = {
  zone: [
    [0.1, 0.1],
    [0.9, 0.1],
    [0.9, 0.9],
    [0.1, 0.9],
  ] as [number, number][],
  line1: [
    [0.2, 0.5],
    [0.8, 0.5],
  ] as [number, number][],
  line2: [
    [0.5, 0.2],
    [0.5, 0.8],
  ] as [number, number][],
}

type ActiveElement = 'zone' | 'line1' | 'line2' | null
type TabType = 'camera' | 'detection' | 'display'

export function CameraSettingsDialog({
  isOpen,
  camera,
  apps,
  onClose,
}: CameraSettingsDialogProps) {
  // Tab
  const [activeTab, setActiveTab] = useState<TabType>('camera')

  // Camera info
  const [cameraName, setCameraName] = useState('')
  const [rtspUrl, setRtspUrl] = useState('')

  // App & Detection
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Detection elements
  const [zone, setZone] = useState<[number, number][]>([])
  const [line1, setLine1] = useState<[number, number][]>([])
  const [line2, setLine2] = useState<[number, number][]>([])
  const [line1Direction, setLine1Direction] = useState<'A2B' | 'B2A' | 'BOTH'>('BOTH')
  const [line2Direction, setLine2Direction] = useState<'A2B' | 'B2A' | 'BOTH'>('BOTH')
  const [activeElement, setActiveElement] = useState<ActiveElement>(null)

  // Display settings
  const getDisplaySettings = useCameraStore((state) => state.getDisplaySettings)
  const setDisplaySettings = useCameraStore((state) => state.setDisplaySettings)
  const [displaySettings, setLocalDisplaySettings] = useState<CameraDisplaySettings>(defaultDisplaySettings)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const ncRef = useRef<NatsConnection | null>(null)

  // Hooks
  const { data: inferences } = useInferencesByVideo(camera?.id || '')
  const createInference = useCreateInference()
  const updateInference = useUpdateInference()
  const updateEventSettings = useUpdateEventSettings()
  const updateCamera = useUpdateCamera()

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  // Load settings when dialog opens
  useEffect(() => {
    if (!isOpen || !camera) return

    // Camera info
    setCameraName(camera.name)
    setRtspUrl(camera.rtsp_url)

    // Display settings
    setLocalDisplaySettings(getDisplaySettings(camera.id))

    // Detection settings
    if (!inferences) return

    const existingInference = inferences[0]
    if (existingInference) {
      setSelectedAppId(existingInference.appId)

      if (existingInference.settings?.configs) {
        const configs = existingInference.settings.configs
        const zoneConfig = configs.find((c: any) => c.eventType === 'RoI')
        const lineConfigs = configs.filter((c: any) => c.eventType === 'Line')

        if (zoneConfig?.points) setZone(zoneConfig.points)
        if (lineConfigs[0]?.points) {
          setLine1(lineConfigs[0].points)
          setLine1Direction(lineConfigs[0].direction || 'BOTH')
        }
        if (lineConfigs[1]?.points) {
          setLine2(lineConfigs[1].points)
          setLine2Direction(lineConfigs[1].direction || 'BOTH')
        }
      }
    }
  }, [isOpen, camera, inferences, getDisplaySettings])

  // Fetch thumbnail from NATS
  useEffect(() => {
    if (!isOpen || !camera?.nats_subject || !camera?.nats_ws_url) return

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
              img.onload = () => { imageRef.current = img }
              img.src = url
            }
          } catch {
            const blob = new Blob([new Uint8Array(msg.data)], { type: 'image/jpeg' })
            const url = URL.createObjectURL(blob)
            setThumbnail(url)
            const img = new Image()
            img.onload = () => { imageRef.current = img }
            img.src = url
          }
          break
        }
      } catch (err) {
        console.error('Failed to fetch thumbnail:', err)
      }
    }

    fetchThumbnail()
    return () => {
      cancelled = true
      ncRef.current?.close()
      ncRef.current = null
    }
  }, [isOpen, camera?.nats_subject, camera?.nats_ws_url])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('camera')
      setCameraName('')
      setRtspUrl('')
      setSelectedAppId(null)
      setZone([])
      setLine1([])
      setLine2([])
      setLine1Direction('BOTH')
      setLine2Direction('BOTH')
      setActiveElement(null)
      setThumbnail(null)
      imageRef.current = null
      ncRef.current?.close()
      ncRef.current = null
    }
  }, [isOpen])

  // Apply template
  const applyTemplate = () => {
    setZone(DEFAULT_TEMPLATE.zone)
    setLine1(DEFAULT_TEMPLATE.line1)
    setLine2(DEFAULT_TEMPLATE.line2)
  }

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || activeTab !== 'detection') return

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
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }
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
          ctx.beginPath()
          ctx.arc(p[0], p[1], 6, 0, Math.PI * 2)
          ctx.fillStyle = '#3b82f6'
          ctx.fill()
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2
          ctx.stroke()
        })
      }
    }

    // Draw line helper
    const drawLine = (linePoints: [number, number][], direction: string, color: string, isActive: boolean, label: string) => {
      if (linePoints.length === 0) return
      const points = linePoints.map(toCanvas)
      if (points.length === 2) {
        ctx.beginPath()
        ctx.moveTo(points[0][0], points[0][1])
        ctx.lineTo(points[1][0], points[1][1])
        ctx.strokeStyle = isActive ? color : color + 'aa'
        ctx.lineWidth = isActive ? 3 : 2
        ctx.stroke()

        const midX = (points[0][0] + points[1][0]) / 2
        const midY = (points[0][1] + points[1][1]) / 2
        const angle = Math.atan2(points[1][1] - points[0][1], points[1][0] - points[0][0])

        const drawArrow = (perpAngle: number, offset: number) => {
          ctx.save()
          ctx.translate(midX + Math.cos(perpAngle) * offset, midY + Math.sin(perpAngle) * offset)
          ctx.rotate(perpAngle)
          ctx.beginPath()
          ctx.moveTo(8, 0)
          ctx.lineTo(-4, -5)
          ctx.lineTo(-4, 5)
          ctx.closePath()
          ctx.fillStyle = color
          ctx.fill()
          ctx.restore()
        }

        if (direction === 'BOTH') { drawArrow(angle + Math.PI / 2, 18); drawArrow(angle - Math.PI / 2, 18) }
        else if (direction === 'A2B') drawArrow(angle + Math.PI / 2, 18)
        else drawArrow(angle - Math.PI / 2, 18)

        ctx.fillStyle = color
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(label, midX, midY - 25)
      }
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

    drawLine(line1, line1Direction, '#f59e0b', activeElement === 'line1', 'Line 1')
    drawLine(line2, line2Direction, '#22c55e', activeElement === 'line2', 'Line 2')
  }, [zone, line1, line2, line1Direction, line2Direction, activeElement, thumbnail, activeTab])

  // Canvas handlers
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current
    if (!canvas) return [0, 0]
    const rect = canvas.getBoundingClientRect()
    return [
      Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    ]
  }, [])

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeElement) return
    const [x, y] = getMousePos(e)
    const points = activeElement === 'zone' ? zone : activeElement === 'line1' ? line1 : line2
    const threshold = 0.04

    for (let i = 0; i < points.length; i++) {
      if (Math.sqrt((x - points[i][0]) ** 2 + (y - points[i][1]) ** 2) < threshold) {
        setDraggingIndex(i)
        return
      }
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
      if (Math.sqrt((x - zone[i][0]) ** 2 + (y - zone[i][1]) ** 2) < 0.04) {
        setZone(zone.filter((_, idx) => idx !== i))
        return
      }
    }
  }

  const toggleDisplaySetting = (key: keyof CameraDisplaySettings) => {
    setLocalDisplaySettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Save
  const handleSave = async () => {
    if (!camera) return
    setIsSaving(true)
    setToast(null)

    try {
      // Save camera info (only if changed)
      const cameraChanged = cameraName !== camera.name || rtspUrl !== camera.rtsp_url
      console.log('[Save] Camera changed:', cameraChanged, {
        name: { old: camera.name, new: cameraName },
        rtsp: { old: camera.rtsp_url, new: rtspUrl }
      })

      if (cameraChanged) {
        console.log('[Save] Updating camera...')
        await updateCamera.mutateAsync({ id: camera.id, data: { name: cameraName, rtsp_url: rtspUrl } })
        console.log('[Save] Camera updated')
      }

      // Save display settings
      setDisplaySettings(camera.id, displaySettings)

      // Save inference settings
      if (selectedAppId) {
        const app = apps.find(a => a.id === selectedAppId)
        if (app) {
          const existingInference = inferences?.[0] // Get first (any) existing inference for this camera
          const inferenceDisplayName = `${app.name} - ${cameraName}`

          console.log('[Save] Inference:', {
            selectedAppId,
            videoId: camera.id,
            existingInference: existingInference ? { appId: existingInference.appId } : null
          })

          if (existingInference) {
            // Always update inference with PUT /inference
            console.log('[Save] Updating inference (PUT /inference)...')
            await updateInference.mutateAsync({
              appId: existingInference.appId,
              videoId: camera.id,
              newAppId: selectedAppId,
              uri: rtspUrl,
              name: inferenceDisplayName,
            })
          } else {
            // Create new inference
            console.log('[Save] Creating new inference (POST /inference)...')
            await createInference.mutateAsync({
              appId: selectedAppId,
              videoId: camera.id,
              uri: rtspUrl,
              name: inferenceDisplayName,
              settings: { version: '1.0', configs: [] },
            })
          }

          // Then update event settings
          const configs: any[] = []
          if (zone.length >= 3) configs.push({ eventType: 'RoI', eventSettingId: `zone-${camera.id}`, eventSettingName: 'Detection Zone', points: zone })
          if (line1.length === 2) configs.push({ eventType: 'Line', eventSettingId: `line1-${camera.id}`, eventSettingName: 'Line 1', points: line1, direction: line1Direction })
          if (line2.length === 2) configs.push({ eventType: 'Line', eventSettingId: `line2-${camera.id}`, eventSettingName: 'Line 2', points: line2, direction: line2Direction })

          if (configs.length > 0) {
            console.log('[Save] Updating event settings (PUT /inference/event-setting)...', { configs: configs.length })
            await updateEventSettings.mutateAsync({
              appId: selectedAppId,
              videoId: camera.id,
              settings: { version: '1.0', configs },
            })
          }
        }
      }

      setToast({ type: 'success', message: '저장되었습니다' })
      setTimeout(() => onClose(), 1000)
    } catch (err) {
      console.error('Failed to save:', err)
      setToast({ type: 'error', message: '저장 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류') })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !camera) return null

  const tabs = [
    { id: 'camera' as const, label: '카메라', icon: Camera },
    { id: 'detection' as const, label: 'Detection', icon: Layers },
    { id: 'display' as const, label: '표시', icon: Eye },
  ]

  const displayToggles = [
    { key: 'showBoundingBox' as const, icon: Square, label: 'Bounding Box' },
    { key: 'showLabel' as const, icon: Tag, label: 'Label' },
    { key: 'showTrackId' as const, icon: Hash, label: 'Track ID' },
    { key: 'showScore' as const, icon: Percent, label: 'Score' },
    { key: 'showKeypoints' as const, icon: Activity, label: 'Keypoints' },
  ]

  const elements = [
    { id: 'zone' as const, label: 'Zone', color: 'blue', points: zone, hasPoints: zone.length >= 3 },
    { id: 'line1' as const, label: 'Line 1', color: 'amber', points: line1, hasPoints: line1.length === 2 },
    { id: 'line2' as const, label: 'Line 2', color: 'green', points: line2, hasPoints: line2.length === 2 },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl overflow-hidden border border-gray-800 shadow-2xl relative">
        {/* Toast */}
        {toast && (
          <div className={cn(
            'absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium z-10 shadow-lg',
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          )}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">카메라 설정</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? '저장 중...' : '저장'}
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === id ? 'text-white border-b-2 border-white bg-gray-800/50' : 'text-gray-400 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Camera Tab */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">카메라 ID</label>
                <input
                  value={camera.id}
                  disabled
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">카메라 이름</label>
                <input
                  value={cameraName}
                  onChange={(e) => setCameraName(e.target.value)}
                  placeholder="카메라 이름"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">RTSP URL</label>
                <input
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  placeholder="rtsp://username:password@ip:port/stream"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Vision App 연결</label>
                <div className="relative">
                  <select
                    value={selectedAppId || ''}
                    onChange={(e) => setSelectedAppId(e.target.value || null)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-white/20"
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
          )}

          {/* Detection Tab */}
          {activeTab === 'detection' && (
            <div className="space-y-4">
              {/* Canvas */}
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
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
              <div className="flex gap-2">
                <button
                  onClick={applyTemplate}
                  className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Layers className="h-4 w-4" />
                  기본 템플릿
                </button>
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
              <div className="grid grid-cols-3 gap-2">
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

              {/* Line Direction */}
              {(activeElement === 'line1' || activeElement === 'line2') && (
                <div>
                  <label className="block text-xs text-gray-400 mb-2">방향</label>
                  <div className="flex gap-1">
                    {(['A2B', 'B2A', 'BOTH'] as const).map((dir) => {
                      const currentDir = activeElement === 'line1' ? line1Direction : line2Direction
                      const setDir = activeElement === 'line1' ? setLine1Direction : setLine2Direction
                      return (
                        <button
                          key={dir}
                          onClick={() => setDir(dir)}
                          className={cn(
                            'flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all',
                            currentDir === dir
                              ? activeElement === 'line1' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-green-500/20 border-green-500 text-green-400'
                              : 'bg-gray-800 border-gray-700 text-gray-400'
                          )}
                        >
                          {dir === 'A2B' ? 'A → B' : dir === 'B2A' ? 'B → A' : '양방향'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Display Tab */}
          {activeTab === 'display' && (
            <div className="space-y-2">
              {displayToggles.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => toggleDisplaySetting(key)}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-lg border transition-all',
                    displaySettings[key] ? 'bg-white/5 border-white/20' : 'bg-gray-800/50 border-gray-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-5 w-5', displaySettings[key] ? 'text-white' : 'text-gray-500')} />
                    <span className={cn('text-sm font-medium', displaySettings[key] ? 'text-white' : 'text-gray-400')}>{label}</span>
                  </div>
                  <div className={cn(
                    'w-10 h-6 rounded-full transition-colors relative',
                    displaySettings[key] ? 'bg-white' : 'bg-gray-600'
                  )}>
                    <div className={cn(
                      'absolute top-1 w-4 h-4 rounded-full transition-transform',
                      displaySettings[key] ? 'translate-x-5 bg-gray-900' : 'translate-x-1 bg-gray-400'
                    )} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
