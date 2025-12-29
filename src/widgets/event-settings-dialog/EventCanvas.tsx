import { useRef, useEffect, useState, useCallback } from 'react'
import type { EventSetting } from '@shared/types'
import { EVENT_TYPE_INFO, requiresGeometry } from './types'

interface EventCanvasProps {
  imageUrl: string
  events: EventSetting[]
  selectedId: string | null
  onUpdatePoints: (id: string, points: [number, number][]) => void
  width?: number
  height?: number
}

export function EventCanvas({
  imageUrl,
  events,
  selectedId,
  onUpdatePoints,
  width = 640,
  height = 480,
}: EventCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [draggingPoint, setDraggingPoint] = useState<{ eventId: string; pointIndex: number } | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ eventId: string; pointIndex: number } | null>(null)

  // Load image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setImage(img)
    img.src = imageUrl
  }, [imageUrl])

  // Convert normalized coords to canvas coords
  const toCanvas = useCallback((point: [number, number]): [number, number] => {
    return [point[0] * width, point[1] * height]
  }, [width, height])

  // Convert canvas coords to normalized coords
  const toNormalized = useCallback((x: number, y: number): [number, number] => {
    return [
      Math.max(0, Math.min(1, x / width)),
      Math.max(0, Math.min(1, y / height)),
    ]
  }, [width, height])

  // Get mouse position relative to canvas (in canvas pixel coordinates)
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current
    if (!canvas) return [0, 0]

    const rect = canvas.getBoundingClientRect()

    // Get mouse position relative to the canvas element (CSS pixels)
    const cssX = e.clientX - rect.left
    const cssY = e.clientY - rect.top

    // Convert CSS pixels to canvas pixels
    // rect.width/height = CSS display size
    // canvas.width/height = internal canvas pixel size
    const canvasX = (cssX / rect.width) * canvas.width
    const canvasY = (cssY / rect.height) * canvas.height

    return [canvasX, canvasY]
  }, [])

  // Find point near mouse position (prioritize selected event)
  const findPointNear = useCallback((x: number, y: number): { eventId: string; pointIndex: number } | null => {
    const threshold = 12

    // First, check the selected event
    const selectedEvent = events.find((ev) => ev.eventSettingId === selectedId)
    if (selectedEvent?.points && requiresGeometry(selectedEvent.eventType)) {
      for (let i = 0; i < selectedEvent.points.length; i++) {
        const [px, py] = toCanvas(selectedEvent.points[i])
        const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
        if (dist < threshold) {
          return { eventId: selectedEvent.eventSettingId, pointIndex: i }
        }
      }
    }

    // Then check other events
    for (const event of events) {
      if (event.eventSettingId === selectedId) continue // Already checked
      if (!event.points || !requiresGeometry(event.eventType)) continue

      for (let i = 0; i < event.points.length; i++) {
        const [px, py] = toCanvas(event.points[i])
        const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
        if (dist < threshold) {
          return { eventId: event.eventSettingId, pointIndex: i }
        }
      }
    }
    return null
  }, [events, toCanvas, selectedId])

  // Draw everything
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Draw image
    if (image) {
      ctx.drawImage(image, 0, 0, width, height)
    } else {
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, width, height)
    }

    // Draw events
    for (const event of events) {
      if (!event.points || !requiresGeometry(event.eventType)) continue

      const info = EVENT_TYPE_INFO[event.eventType]
      const isSelected = event.eventSettingId === selectedId
      const points = event.points.map(toCanvas)

      ctx.save()

      if (event.eventType === 'Line') {
        // Draw line
        ctx.beginPath()
        ctx.moveTo(points[0][0], points[0][1])
        ctx.lineTo(points[1][0], points[1][1])
        ctx.strokeStyle = info.color
        ctx.lineWidth = isSelected ? 3 : 2
        ctx.stroke()

        // Draw perpendicular direction arrow(s) (crossing direction)
        if (event.direction) {
          const [x1, y1] = points[0]
          const [x2, y2] = points[1]
          const midX = (x1 + x2) / 2
          const midY = (y1 + y2) / 2
          const lineAngle = Math.atan2(y2 - y1, x2 - x1)

          const drawArrow = (angle: number, offset: number = 0) => {
            ctx.save()
            ctx.translate(midX + Math.cos(angle) * offset, midY + Math.sin(angle) * offset)
            ctx.rotate(angle)
            ctx.beginPath()
            ctx.moveTo(15, 0)
            ctx.lineTo(0, -6)
            ctx.lineTo(0, 6)
            ctx.closePath()
            ctx.fillStyle = info.color
            ctx.fill()
            ctx.restore()
          }

          if (event.direction === 'BOTH') {
            // Draw both directions
            drawArrow(lineAngle + Math.PI / 2, 8)  // A side → B side
            drawArrow(lineAngle - Math.PI / 2, 8)  // B side → A side
          } else {
            // Single direction
            const perpAngle = event.direction === 'A2B'
              ? lineAngle + Math.PI / 2
              : lineAngle - Math.PI / 2
            drawArrow(perpAngle)
          }
        }

        // Draw A/B labels
        ctx.font = 'bold 12px Arial'
        ctx.fillStyle = info.color
        ctx.fillText('A', points[0][0] - 15, points[0][1] - 5)
        ctx.fillText('B', points[1][0] + 5, points[1][1] - 5)
      } else {
        // Draw polygon
        ctx.beginPath()
        ctx.moveTo(points[0][0], points[0][1])
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i][0], points[i][1])
        }
        ctx.closePath()

        // Fill with transparency
        ctx.fillStyle = info.color + (isSelected ? '40' : '20')
        ctx.fill()

        // Stroke
        ctx.strokeStyle = info.color
        ctx.lineWidth = isSelected ? 3 : 2
        ctx.stroke()
      }

      // Draw points with index numbers
      for (let i = 0; i < points.length; i++) {
        const [px, py] = points[i]
        const isHovered = hoveredPoint?.eventId === event.eventSettingId && hoveredPoint?.pointIndex === i
        const isDragging = draggingPoint?.eventId === event.eventSettingId && draggingPoint?.pointIndex === i

        // Draw point circle
        ctx.beginPath()
        ctx.arc(px, py, isHovered || isDragging ? 10 : 8, 0, Math.PI * 2)
        ctx.fillStyle = isDragging ? '#fff' : info.color
        ctx.fill()
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 1
        ctx.stroke()

        // Draw index number on point
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(i), px, py)
      }

      // Draw label
      if (points.length > 0) {
        const labelX = points[0][0]
        const labelY = points[0][1] - 15
        ctx.font = 'bold 11px Arial'
        const text = event.eventSettingName
        const textWidth = ctx.measureText(text).width

        ctx.fillStyle = info.color
        ctx.fillRect(labelX - 2, labelY - 12, textWidth + 8, 16)
        ctx.fillStyle = '#000'
        ctx.fillText(text, labelX + 2, labelY)
      }

      ctx.restore()
    }
  }, [image, events, selectedId, hoveredPoint, draggingPoint, width, height, toCanvas])

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = getMousePos(e)
    const point = findPointNear(x, y)
    if (point) {
      setDraggingPoint(point)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = getMousePos(e)

    if (draggingPoint) {
      // Update point position
      const event = events.find((ev) => ev.eventSettingId === draggingPoint.eventId)
      if (event?.points) {
        const newPoints = [...event.points] as [number, number][]
        newPoints[draggingPoint.pointIndex] = toNormalized(x, y)
        onUpdatePoints(draggingPoint.eventId, newPoints)
      }
    } else {
      // Update hover state
      const point = findPointNear(x, y)
      setHoveredPoint(point)
    }
  }

  const handleMouseUp = () => {
    setDraggingPoint(null)
  }

  const handleMouseLeave = () => {
    setDraggingPoint(null)
    setHoveredPoint(null)
  }

  // Double-click to add point (for polygons)
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = getMousePos(e)
    const selectedEvent = events.find((ev) => ev.eventSettingId === selectedId)

    if (!selectedEvent?.points || selectedEvent.eventType === 'Line') return

    // Find edge to insert point
    const points = selectedEvent.points.map(toCanvas)
    let bestEdge = -1
    let bestDist = 20 // threshold

    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      const [x1, y1] = points[i]
      const [x2, y2] = points[j]

      // Distance from point to line segment
      const dx = x2 - x1
      const dy = y2 - y1
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
      const px = x1 + t * dx
      const py = y1 + t * dy
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2)

      if (dist < bestDist) {
        bestDist = dist
        bestEdge = i
      }
    }

    if (bestEdge >= 0 && selectedId) {
      const newPoints = [...selectedEvent.points] as [number, number][]
      newPoints.splice(bestEdge + 1, 0, toNormalized(x, y))
      onUpdatePoints(selectedId, newPoints)
    }
  }

  // Right-click to remove point (only on selected event)
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    // Only allow removing points from selected event
    if (!selectedId) return

    const [mouseX, mouseY] = getMousePos(e)
    const selectedEvent = events.find((ev) => ev.eventSettingId === selectedId)

    if (!selectedEvent?.points || selectedEvent.eventType === 'Line') return
    if (selectedEvent.points.length <= 3) return // Minimum 3 points

    // Find the closest point within threshold
    const threshold = 20
    let closestIndex = -1
    let closestDist = Infinity

    for (let i = 0; i < selectedEvent.points.length; i++) {
      const [px, py] = toCanvas(selectedEvent.points[i])
      const dist = Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2)

      if (dist < closestDist) {
        closestDist = dist
        closestIndex = i
      }
    }

    if (closestIndex >= 0 && closestDist < threshold) {
      const newPoints = selectedEvent.points.filter((_, i) => i !== closestIndex) as [number, number][]
      onUpdatePoints(selectedId, newPoints)
    }
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded cursor-crosshair outline outline-1 outline-border"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />
    </div>
  )
}
