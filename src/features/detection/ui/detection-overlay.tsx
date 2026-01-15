import { useRef, useEffect, useCallback } from 'react'
import type { DetectionObject } from '@shared/types'
import type { CameraDisplaySettings } from '@features/camera'

interface DetectionOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  getLatestDetection: () => DetectionObject[]
  displaySettings?: CameraDisplaySettings
  className?: string
}

const defaultSettings: CameraDisplaySettings = {
  showBoundingBox: true,
  showLabel: true,
  showTrackId: false,
  showScore: false,
  showKeypoints: false,
  showEventSettings: false,
}

const LABEL_COLORS: Record<string, string> = {
  vehicle: '#00FF00',
  person: '#FF6600',
  animal: '#00FFFF',
  default: '#FFFF00',
}

// Calculate object-cover offset and scale
function getObjectCoverTransform(
  videoWidth: number,
  videoHeight: number,
  containerWidth: number,
  containerHeight: number
) {
  const videoAspect = videoWidth / videoHeight
  const containerAspect = containerWidth / containerHeight

  let scale: number
  let offsetX = 0
  let offsetY = 0

  if (videoAspect > containerAspect) {
    // Video is wider - crop horizontally
    scale = containerHeight / videoHeight
    const scaledWidth = videoWidth * scale
    offsetX = (scaledWidth - containerWidth) / 2
  } else {
    // Video is taller - crop vertically
    scale = containerWidth / videoWidth
    const scaledHeight = videoHeight * scale
    offsetY = (scaledHeight - containerHeight) / 2
  }

  return { scale, offsetX, offsetY }
}

export function DetectionOverlay({
  videoRef,
  getLatestDetection,
  displaySettings = defaultSettings,
  className,
}: DetectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameCallbackIdRef = useRef<number | null>(null)

  const draw = useCallback((objects: DetectionObject[]) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Get container dimensions
    const containerWidth = video.clientWidth
    const containerHeight = video.clientHeight

    // Get actual video dimensions
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    if (videoWidth === 0 || videoHeight === 0) return

    // Update canvas size to match container
    if (canvas.width !== containerWidth || canvas.height !== containerHeight) {
      canvas.width = containerWidth
      canvas.height = containerHeight
    }

    // Calculate object-cover transform
    const { scale, offsetX, offsetY } = getObjectCoverTransform(
      videoWidth,
      videoHeight,
      containerWidth,
      containerHeight
    )

    // Clear canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight)

    // If nothing to show, exit early
    if (!displaySettings.showBoundingBox) return

    objects.forEach((obj) => {
      const color = LABEL_COLORS[obj.label] || LABEL_COLORS.default

      // Convert normalized coords (0-1) to video pixel coords
      const videoX = obj.bbox.x * videoWidth
      const videoY = obj.bbox.y * videoHeight
      const videoW = obj.bbox.w * videoWidth
      const videoH = obj.bbox.h * videoHeight

      // Apply object-cover transform to get canvas coords
      const x = videoX * scale - offsetX
      const y = videoY * scale - offsetY
      const w = videoW * scale
      const h = videoH * scale

      // Skip if completely outside visible area
      if (x + w < 0 || x > containerWidth || y + h < 0 || y > containerHeight) {
        return
      }

      // Draw bbox
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)

      // Build label text based on settings
      const labelParts: string[] = []
      if (displaySettings.showLabel) {
        labelParts.push(obj.label)
      }
      if (displaySettings.showTrackId && obj.id !== undefined) {
        labelParts.push(`#${obj.id}`)
      }
      if (displaySettings.showScore) {
        labelParts.push(`${(obj.score_d * 100).toFixed(0)}%`)
      }

      // Only draw label if there's something to show
      if (labelParts.length > 0) {
        const label = labelParts.join(' ')
        ctx.font = 'bold 12px Arial'
        const textMetrics = ctx.measureText(label)
        const textHeight = 16
        const padding = 4

        const labelY = Math.max(y - textHeight - padding, 0)

        ctx.fillStyle = color
        ctx.fillRect(
          x,
          labelY,
          textMetrics.width + padding * 2,
          textHeight + padding
        )

        // Draw label text
        ctx.fillStyle = '#000000'
        ctx.fillText(label, x + padding, labelY + textHeight - 2)
      }
    })
  }, [videoRef, displaySettings])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let isActive = true

    const frameCallback: VideoFrameRequestCallback = () => {
      if (!isActive) return

      // Simply use latest detection - synced by requestVideoFrameCallback timing
      const objects = getLatestDetection()
      draw(objects)

      frameCallbackIdRef.current = video.requestVideoFrameCallback(frameCallback)
    }

    // Start frame callback loop
    frameCallbackIdRef.current = video.requestVideoFrameCallback(frameCallback)

    return () => {
      isActive = false
      if (frameCallbackIdRef.current !== null) {
        video.cancelVideoFrameCallback(frameCallbackIdRef.current)
        frameCallbackIdRef.current = null
      }
    }
  }, [videoRef, draw, getLatestDetection])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}
