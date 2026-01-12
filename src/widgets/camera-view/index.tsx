import { useRef, useEffect, useState, useCallback } from 'react'
import { X, Maximize2, Settings } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { useNatsStream, type Detection, type EventAlert } from '@features/stream'
import { useInferencesByVideo } from '@features/inference'
import type { CameraDisplaySettings } from '@features/camera'
import type { Camera, CameraPlayerStatus } from '@shared/types'

// 20개 색상 팔레트 (class별 고정 색상)
// 키포인트용 색상(초록/노랑/빨강) 제외
const CLASS_COLORS = [
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#78716c', // stone
  '#71717a', // zinc
  '#64748b', // slate
  '#0891b2', // cyan-600
  '#0d9488', // teal-600
  '#7c3aed', // violet-600
]

// class 이름 해시로 색상 할당
const getClassColor = (className: string): string => {
  const hash = className.toLowerCase().split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  const index = Math.abs(hash) % CLASS_COLORS.length
  return CLASS_COLORS[index]
}

interface CameraViewProps {
  camera: Camera
  onRemove?: (id: string) => void
  onMaximize?: (id: string) => void
  onSettings?: (id: string) => void
  onEventTriggered?: (alert: EventAlert) => void
  displaySettings?: CameraDisplaySettings
  className?: string
  showControls?: boolean
}

export function CameraView({
  camera,
  onRemove,
  onMaximize,
  onSettings,
  onEventTriggered,
  displaySettings,
  className,
  showControls = true,
}: CameraViewProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<CameraPlayerStatus>('loading')
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9) // default 16:9
  const animationFrameRef = useRef<number | null>(null)

  // Fetch event settings for this camera
  const { data: inferences } = useInferencesByVideo(camera.id)
  const eventConfigs = inferences?.[0]?.settings?.configs || []

  // Handle event with camera name
  const handleEventTriggered = useCallback((alert: EventAlert) => {
    onEventTriggered?.({
      ...alert,
      cameraName: camera.name,
    })
  }, [onEventTriggered, camera.name])

  // NATS stream hook
  const {
    isConnected,
    error,
    fps,
    getImageDataUrl,
    getDetections,
    getFrameDimensions,
  } = useNatsStream({
    natsWsUrl: camera.nats_ws_url,
    natsSubject: camera.nats_subject,
    enabled: true,
    onEventTriggered: handleEventTriggered,
  })

  // Update status based on connection
  useEffect(() => {
    if (error) {
      setStatus('error')
    } else if (isConnected) {
      setStatus('playing')
    } else if (!camera.nats_ws_url || !camera.nats_subject) {
      setStatus('offline')
    } else {
      setStatus('loading')
    }
  }, [isConnected, error, camera.nats_ws_url, camera.nats_subject])

  // Update image and draw detections
  const updateFrame = useCallback(() => {
    const img = imgRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const imageDataUrl = getImageDataUrl()

    if (!canvas || !ctx || !img) {
      animationFrameRef.current = requestAnimationFrame(updateFrame)
      return
    }

    // Update hidden img src
    if (imageDataUrl && img.src !== imageDataUrl) {
      img.src = imageDataUrl
    }

    // Wait for image to load
    if (!img.complete || img.naturalWidth === 0) {
      animationFrameRef.current = requestAnimationFrame(updateFrame)
      return
    }

    const { width, height } = getFrameDimensions()

    // Update aspect ratio if changed
    if (width > 0 && height > 0) {
      const newAspectRatio = width / height
      setAspectRatio(prev => Math.abs(prev - newAspectRatio) > 0.01 ? newAspectRatio : prev)
    }

    // Match canvas size to container
    const rect = canvas.getBoundingClientRect()
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width
      canvas.height = rect.height
    }

    // Draw image (fills entire canvas since aspect ratio matches)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // Draw detections
    const detections = getDetections()
    if (detections.length > 0 && width > 0 && height > 0) {
      const scaleX = canvas.width / width
      const scaleY = canvas.height / height

      drawDetections(ctx, detections, scaleX, scaleY, 0, 0, canvas.width, canvas.height, displaySettings)
    }

    // Draw event settings (zones, lines) if enabled
    if (displaySettings?.showEventSettings && eventConfigs.length > 0) {
      drawEventSettings(ctx, eventConfigs, canvas.width, canvas.height)
    }

    animationFrameRef.current = requestAnimationFrame(updateFrame)
  }, [getImageDataUrl, getDetections, getFrameDimensions, displaySettings, eventConfigs])

  // Start animation loop
  useEffect(() => {
    if (isConnected) {
      animationFrameRef.current = requestAnimationFrame(updateFrame)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isConnected, updateFrame])

  // Draw detection boxes with scaling and offset
  const drawDetections = (
    ctx: CanvasRenderingContext2D,
    detections: Detection[],
    scaleX: number,
    scaleY: number,
    offsetX: number = 0,
    offsetY: number = 0,
    canvasWidth: number,
    canvasHeight: number,
    settings?: CameraDisplaySettings
  ) => {
    const showBoundingBox = settings?.showBoundingBox !== false
    const showLabel = settings?.showLabel !== false
    const showScore = settings?.showScore !== false
    const showKeypoints = settings?.showKeypoints !== false

    detections.forEach((det) => {
      // Scale bbox coordinates (x, y is top-left corner)
      const x = det.bbox.x * scaleX + offsetX
      const y = det.bbox.y * scaleY + offsetY
      const width = det.bbox.width * scaleX
      const height = det.bbox.height * scaleY

      // Get color based on class
      const color = getClassColor(det.class)

      // Draw bounding box
      if (showBoundingBox) {
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, width, height)
      }

      // Build label text based on settings
      const labelParts: string[] = []
      if (showLabel) labelParts.push(det.class)
      if (showScore) labelParts.push(`${(det.confidence * 100).toFixed(0)}%`)
      const labelText = labelParts.join(' ')

      if (labelText) {
        ctx.font = '14px sans-serif'
        const textMetrics = ctx.measureText(labelText)
        const textHeight = 18
        const padding = 4

        ctx.fillStyle = color
        ctx.fillRect(
          x,
          y - textHeight - padding,
          textMetrics.width + padding * 2,
          textHeight + padding
        )

        ctx.fillStyle = '#ffffff'
        ctx.fillText(labelText, x + padding, y - padding - 2)
      }

      // Draw keypoints as connected lines
      if (showKeypoints && det.keypoints && det.keypoints.length > 0) {
        try {
          const kps = det.keypoints

          // Draw lines connecting sequential keypoints
          for (let i = 0; i < kps.length - 1; i++) {
            const [x1, y1, conf1] = kps[i]
            const [x2, y2, conf2] = kps[i + 1]

            // Skip if either point has low confidence
            if (conf1 < 0.3 || conf2 < 0.3) continue

            const px1 = x1 * canvasWidth
            const py1 = y1 * canvasHeight
            const px2 = x2 * canvasWidth
            const py2 = y2 * canvasHeight

            // Line color based on average confidence
            const avgConf = (conf1 + conf2) / 2
            let lineColor = '#22c55e' // green
            if (avgConf < 0.5) {
              lineColor = '#ef4444' // red
            } else if (avgConf < 0.7) {
              lineColor = '#eab308' // yellow
            }

            ctx.beginPath()
            ctx.moveTo(px1, py1)
            ctx.lineTo(px2, py2)
            ctx.strokeStyle = lineColor
            ctx.lineWidth = 2
            ctx.stroke()
          }

          // Draw points on top of lines
          kps.forEach((kp) => {
            const [kpX, kpY, kpConf] = kp
            if (kpConf < 0.3) return

            const px = kpX * canvasWidth
            const py = kpY * canvasHeight

            let kpColor = '#22c55e'
            if (kpConf < 0.5) {
              kpColor = '#ef4444'
            } else if (kpConf < 0.7) {
              kpColor = '#eab308'
            }

            ctx.beginPath()
            ctx.arc(px, py, 4, 0, Math.PI * 2)
            ctx.fillStyle = kpColor
            ctx.fill()
          })
        } catch {
          // Ignore keypoint drawing errors
        }
      }
    })
  }

  // Draw event settings (ROI zones, Lines)
  const drawEventSettings = (
    ctx: CanvasRenderingContext2D,
    configs: any[],
    canvasWidth: number,
    canvasHeight: number
  ) => {
    configs.forEach((config) => {
      if (!config.points || config.points.length === 0) return

      // Convert normalized coords to canvas coords
      const points = config.points.map((p: [number, number]) => [
        p[0] * canvasWidth,
        p[1] * canvasHeight,
      ])

      if (config.eventType === 'ROI' || config.eventType === 'RoI') {
        // Draw zone polygon
        if (points.length >= 3) {
          ctx.beginPath()
          ctx.moveTo(points[0][0], points[0][1])
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1])
          }
          ctx.closePath()
          ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'
          ctx.fill()
          ctx.strokeStyle = '#3b82f6'
          ctx.lineWidth = 2
          ctx.stroke()

          // Label
          ctx.fillStyle = '#3b82f6'
          ctx.font = 'bold 12px sans-serif'
          ctx.fillText(config.eventSettingName || 'ROI', points[0][0] + 5, points[0][1] + 15)
        }
      } else if (config.eventType === 'Line') {
        // Draw line
        if (points.length === 2) {
          const [p1, p2] = points
          const color = config.eventSettingName?.includes('진입') ? '#f59e0b' : '#22c55e'

          // Main line
          ctx.beginPath()
          ctx.moveTo(p1[0], p1[1])
          ctx.lineTo(p2[0], p2[1])
          ctx.strokeStyle = color
          ctx.lineWidth = 3
          ctx.stroke()

          // Direction arrow
          const midX = (p1[0] + p2[0]) / 2
          const midY = (p1[1] + p2[1]) / 2
          const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0])
          const perpAngle = angle + Math.PI / 2
          const arrowAngle = config.direction === 'B2A' ? perpAngle + Math.PI : perpAngle

          ctx.save()
          ctx.translate(midX + Math.cos(arrowAngle) * 15, midY + Math.sin(arrowAngle) * 15)
          ctx.rotate(arrowAngle)
          ctx.beginPath()
          ctx.moveTo(8, 0)
          ctx.lineTo(-4, -5)
          ctx.lineTo(-4, 5)
          ctx.closePath()
          ctx.fillStyle = color
          ctx.fill()
          ctx.restore()

          // Points A, B
          ;[p1, p2].forEach((p, i) => {
            ctx.beginPath()
            ctx.arc(p[0], p[1], 8, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
            ctx.fillStyle = '#000'
            ctx.font = 'bold 10px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(i === 0 ? 'A' : 'B', p[0], p[1])
          })

          // Label
          ctx.fillStyle = color
          ctx.font = 'bold 11px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(config.eventSettingName || 'Line', midX, midY - 20)
        }
      }
    })
  }

  const statusColors: Record<CameraPlayerStatus, string> = {
    loading: 'bg-yellow-500',
    playing: 'bg-green-500',
    error: 'bg-red-500',
    offline: 'bg-gray-500',
  }

  const statusLabels: Record<CameraPlayerStatus, string> = {
    loading: 'Connecting...',
    playing: 'Live',
    error: 'Connection Error',
    offline: 'Offline',
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black rounded-lg overflow-hidden group',
        className
      )}
      style={{ aspectRatio: aspectRatio }}
    >
      {/* Status indicator */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        <span
          className={cn(
            'w-2 h-2 rounded-full animate-pulse',
            statusColors[status]
          )}
        />
        <span className="text-white text-xs bg-black/60 px-2 py-1 rounded">
          {camera.name}
        </span>
        {status === 'playing' && fps > 0 && (
          <span className="text-white text-xs bg-black/60 px-2 py-1 rounded">
            {fps.toFixed(1)} FPS
          </span>
        )}
        {status !== 'playing' && (
          <span className="text-white text-xs bg-black/60 px-2 py-1 rounded">
            {statusLabels[status]}
          </span>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {/* Settings button - always visible */}
          {onSettings && (
            <button
              onClick={() => onSettings(camera.id)}
              className="bg-black/60 text-white p-1.5 rounded hover:bg-black/80 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          {/* Other controls - visible on hover */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onMaximize && (
              <button
                onClick={() => onMaximize(camera.id)}
                className="bg-black/60 text-white p-1.5 rounded hover:bg-black/80 transition-colors"
                title="Maximize"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(camera.id)}
                className="bg-red-500/80 text-white p-1.5 rounded hover:bg-red-600 transition-colors"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Video canvas (image + detections) */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />

      {/* Hidden img for loading */}
      <img
        ref={imgRef}
        alt={camera.name}
        className="hidden"
      />

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm">Connecting...</span>
          </div>
        </div>
      )}

      {/* Error/Offline overlay */}
      {(status === 'error' || status === 'offline') && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                status === 'error' ? 'bg-red-500/20' : 'bg-gray-500/20'
              )}
            >
              <X
                className={cn(
                  'w-6 h-6',
                  status === 'error' ? 'text-red-500' : 'text-gray-500'
                )}
              />
            </div>
            <span className="text-white text-sm font-medium">
              {status === 'error' ? 'Connection Error' : 'Camera Offline'}
            </span>
            <span className="text-gray-400 text-xs">
              {status === 'error'
                ? 'Failed to connect to stream'
                : 'No NATS stream configured'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
