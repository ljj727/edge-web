import React, { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Line, Circle, Rect, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import { Button } from '@shared/ui'
import { Pentagon, Square, Maximize, Check, X } from 'lucide-react'

export type ZoneType = 'polygon' | 'bbox' | 'full'

export interface Zone {
  id: string
  name: string
  type: ZoneType
  points: number[] // polygon: [x1,y1,x2,y2,...], bbox: [x,y,width,height], full: []
  color: string
}

interface ZoneEditorProps {
  thumbnailUrl: string
  zones: Zone[]
  selectedZoneId: string | null
  onZonesChange: (zones: Zone[]) => void
  onSelectZone: (zoneId: string | null) => void
  onZoneCreated?: (zone: Zone) => void // callback when zone is confirmed
  width?: number
  height?: number
}

const SNAP_THRESHOLD = 15 // pixels for magnet effect
const ZONE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']

export function ZoneEditor({
  thumbnailUrl,
  zones,
  selectedZoneId,
  onZonesChange,
  onSelectZone,
  onZoneCreated,
  width = 480,
  height = 360,
}: ZoneEditorProps) {
  const [image] = useImage(thumbnailUrl)
  const stageRef = useRef<any>(null)
  const [drawMode, setDrawMode] = useState<ZoneType | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [pendingPoints, setPendingPoints] = useState<number[]>([])
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [isSnapped, setIsSnapped] = useState(false)

  // Scale image to fit container
  const scale = image ? Math.min(width / image.width, height / image.height) : 1
  const scaledWidth = image ? image.width * scale : width
  const scaledHeight = image ? image.height * scale : height
  const offsetX = (width - scaledWidth) / 2
  const offsetY = (height - scaledHeight) / 2

  const getNextColor = () => ZONE_COLORS[zones.length % ZONE_COLORS.length]
  const getNextZoneName = () => `Zone#${zones.length + 1}`

  // Check if point is near the first point (for polygon snap)
  const checkSnap = (x: number, y: number): boolean => {
    if (pendingPoints.length < 4) return false // need at least 2 points (4 values)
    const firstX = pendingPoints[0]
    const firstY = pendingPoints[1]
    const distance = Math.sqrt((x - firstX) ** 2 + (y - firstY) ** 2)
    return distance <= SNAP_THRESHOLD
  }

  const handleStageClick = () => {
    if (!drawMode) return

    const stage = stageRef.current
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    if (drawMode === 'polygon') {
      if (!isDrawing) {
        // Start drawing
        setIsDrawing(true)
        setPendingPoints([pos.x, pos.y])
      } else {
        // Check if snapped to first point - auto complete
        if (isSnapped && pendingPoints.length >= 6) {
          // Auto-confirm polygon when clicked while snapped
          const newZone: Zone = {
            id: `zone-${Date.now()}`,
            name: getNextZoneName(),
            type: 'polygon',
            points: pendingPoints,
            color: getNextColor(),
          }
          onZonesChange([...zones, newZone])
          onZoneCreated?.(newZone)
          setIsDrawing(false)
          setPendingPoints([])
          setDrawMode(null)
          setIsSnapped(false)
        } else {
          // Add point
          setPendingPoints([...pendingPoints, pos.x, pos.y])
        }
      }
    } else if (drawMode === 'bbox') {
      if (!isDrawing) {
        // First click - start bbox
        setIsDrawing(true)
        setPendingPoints([pos.x, pos.y])
      } else {
        // Second click - complete bbox
        const [startX, startY] = pendingPoints
        let x = Math.min(startX, pos.x)
        let y = Math.min(startY, pos.y)
        let w = Math.abs(pos.x - startX)
        let h = Math.abs(pos.y - startY)

        if (w > 10 && h > 10) {
          setPendingPoints([x, y, w, h])
        }
        // BBox is ready to be confirmed (don't auto-finish)
      }
    }
  }

  const handleMouseMove = () => {
    const stage = stageRef.current
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    setMousePos(pos)

    // Check snap for polygon
    if (drawMode === 'polygon' && isDrawing) {
      setIsSnapped(checkSnap(pos.x, pos.y))
    }
  }

  const handleSetFullArea = () => {
    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      name: getNextZoneName(),
      type: 'full',
      points: [offsetX, offsetY, scaledWidth, scaledHeight],
      color: getNextColor(),
    }
    onZonesChange([...zones, newZone])
    onZoneCreated?.(newZone)
    setDrawMode(null)
  }

  const handleConfirmZone = () => {
    if (drawMode === 'polygon' && pendingPoints.length >= 6) {
      const newZone: Zone = {
        id: `zone-${Date.now()}`,
        name: getNextZoneName(),
        type: 'polygon',
        points: pendingPoints,
        color: getNextColor(),
      }
      onZonesChange([...zones, newZone])
      onZoneCreated?.(newZone)
    } else if (drawMode === 'bbox' && pendingPoints.length === 4) {
      const newZone: Zone = {
        id: `zone-${Date.now()}`,
        name: getNextZoneName(),
        type: 'bbox',
        points: pendingPoints,
        color: getNextColor(),
      }
      onZonesChange([...zones, newZone])
      onZoneCreated?.(newZone)
    }

    // Reset state
    setIsDrawing(false)
    setPendingPoints([])
    setDrawMode(null)
    setIsSnapped(false)
  }

  const handleCancelDrawing = () => {
    setIsDrawing(false)
    setPendingPoints([])
    setDrawMode(null)
    setIsSnapped(false)
  }

  const handlePointDrag = (zoneId: string, pointIndex: number, newX: number, newY: number) => {
    const zone = zones.find(z => z.id === zoneId)
    if (!zone || zone.type !== 'polygon') return

    const newPoints = [...zone.points]
    newPoints[pointIndex * 2] = newX
    newPoints[pointIndex * 2 + 1] = newY
    onZonesChange(zones.map(z => z.id === zoneId ? { ...z, points: newPoints } : z))
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelDrawing()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // For polygon, check if we have enough points and snapped
  const isPolygonReady = drawMode === 'polygon' && pendingPoints.length >= 6 && isSnapped
  // For bbox, check if we have 4 values (after second click)
  const isBboxReady = drawMode === 'bbox' && pendingPoints.length === 4

  return (
    <div className="space-y-2">
      {/* Tool buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={drawMode === 'polygon' ? 'default' : 'outline'}
          onClick={() => { setDrawMode('polygon'); handleCancelDrawing(); setDrawMode('polygon'); }}
          disabled={isDrawing}
          title="Draw Polygon"
        >
          <Pentagon className="h-4 w-4 mr-1" />
          Polygon
        </Button>
        <Button
          size="sm"
          variant={drawMode === 'bbox' ? 'default' : 'outline'}
          onClick={() => { setDrawMode('bbox'); handleCancelDrawing(); setDrawMode('bbox'); }}
          disabled={isDrawing}
          title="Draw Bounding Box"
        >
          <Square className="h-4 w-4 mr-1" />
          BBox
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSetFullArea}
          disabled={isDrawing}
          title="Full Area"
        >
          <Maximize className="h-4 w-4 mr-1" />
          Full
        </Button>

        {/* Confirm/Cancel buttons when drawing */}
        {isDrawing && (isPolygonReady || isBboxReady) && (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={handleConfirmZone}
              title="Confirm Zone"
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Confirm
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleCancelDrawing}
              title="Cancel"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </>
        )}
      </div>

      {/* Canvas */}
      <div className="border rounded-lg overflow-hidden bg-black">
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onClick={handleStageClick}
          onMouseMove={handleMouseMove}
        >
          <Layer>
            {/* Thumbnail image */}
            {image && (
              <KonvaImage
                image={image}
                width={scaledWidth}
                height={scaledHeight}
                x={offsetX}
                y={offsetY}
              />
            )}

            {/* Existing zones */}
            {zones.map((zone) => (
              <React.Fragment key={zone.id}>
                {zone.type === 'polygon' && (
                  <>
                    <Line
                      points={zone.points}
                      closed
                      fill={`${zone.color}40`}
                      stroke={selectedZoneId === zone.id ? '#fff' : zone.color}
                      strokeWidth={selectedZoneId === zone.id ? 3 : 2}
                      onClick={() => onSelectZone(zone.id)}
                    />
                    {selectedZoneId === zone.id && Array.from({ length: zone.points.length / 2 }).map((_, i) => (
                      <Circle
                        key={i}
                        x={zone.points[i * 2]}
                        y={zone.points[i * 2 + 1]}
                        radius={6}
                        fill="#fff"
                        stroke={zone.color}
                        strokeWidth={2}
                        draggable
                        onDragMove={(e) => {
                          handlePointDrag(zone.id, i, e.target.x(), e.target.y())
                        }}
                      />
                    ))}
                  </>
                )}

                {(zone.type === 'bbox' || zone.type === 'full') && (
                  <Rect
                    x={zone.points[0]}
                    y={zone.points[1]}
                    width={zone.points[2]}
                    height={zone.points[3]}
                    fill={`${zone.color}40`}
                    stroke={selectedZoneId === zone.id ? '#fff' : zone.color}
                    strokeWidth={selectedZoneId === zone.id ? 3 : 2}
                    onClick={() => onSelectZone(zone.id)}
                  />
                )}
              </React.Fragment>
            ))}

            {/* Currently drawing polygon */}
            {isDrawing && drawMode === 'polygon' && pendingPoints.length >= 2 && (
              <>
                <Line
                  points={mousePos ? [...pendingPoints, mousePos.x, mousePos.y] : pendingPoints}
                  stroke="#00ff00"
                  strokeWidth={2}
                  dash={[5, 5]}
                />
                {Array.from({ length: pendingPoints.length / 2 }).map((_, i) => (
                  <Circle
                    key={i}
                    x={pendingPoints[i * 2]}
                    y={pendingPoints[i * 2 + 1]}
                    radius={i === 0 && isSnapped ? 10 : 5}
                    fill={i === 0 && isSnapped ? '#ffff00' : '#00ff00'}
                    stroke={i === 0 && isSnapped ? '#ff0000' : undefined}
                    strokeWidth={i === 0 && isSnapped ? 2 : 0}
                  />
                ))}
              </>
            )}

            {/* Currently drawing bbox - show preview */}
            {isDrawing && drawMode === 'bbox' && pendingPoints.length >= 2 && mousePos && (
              <Rect
                x={Math.min(pendingPoints[0], pendingPoints.length === 4 ? pendingPoints[0] : mousePos.x)}
                y={Math.min(pendingPoints[1], pendingPoints.length === 4 ? pendingPoints[1] : mousePos.y)}
                width={pendingPoints.length === 4 ? pendingPoints[2] : Math.abs(mousePos.x - pendingPoints[0])}
                height={pendingPoints.length === 4 ? pendingPoints[3] : Math.abs(mousePos.y - pendingPoints[1])}
                fill="rgba(0, 255, 0, 0.2)"
                stroke="#00ff00"
                strokeWidth={2}
                dash={pendingPoints.length === 4 ? undefined : [5, 5]}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Instructions */}
      <div className="text-xs text-muted-foreground">
        {!drawMode && !isDrawing && 'Select a drawing tool above'}
        {drawMode === 'polygon' && !isDrawing && 'Click to start drawing polygon'}
        {drawMode === 'polygon' && isDrawing && !isSnapped && `Click to add points (${pendingPoints.length / 2} points). Move near first point to close.`}
        {drawMode === 'polygon' && isDrawing && isSnapped && 'Click to complete polygon!'}
        {drawMode === 'bbox' && !isDrawing && 'Click to set first corner'}
        {drawMode === 'bbox' && isDrawing && pendingPoints.length === 2 && 'Click to set second corner'}
        {drawMode === 'bbox' && isDrawing && pendingPoints.length === 4 && 'Press Confirm to create zone'}
      </div>
    </div>
  )
}
