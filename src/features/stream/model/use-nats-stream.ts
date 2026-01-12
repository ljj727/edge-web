import { useEffect, useRef, useState, useCallback } from 'react'
import { connect, StringCodec } from 'nats.ws'
import type { NatsConnection, Subscription } from 'nats.ws'

// Detection bbox type
export interface DetectionBBox {
  x: number
  y: number
  width: number
  height: number
}

// Single detection object
export interface Detection {
  class: string
  class_id: number
  confidence: number
  bbox: DetectionBBox
  keypoints?: [number, number, number][] // [x, y, confidence] normalized 0-1
}

// Event status from detection
// ROI: status 2 = triggered
// Line: status 0 = safe, 1 = warning, 2 = danger
export interface EventStatus {
  labels: string[]
  status: number
}

// Events map (eventSettingId -> status)
export type EventsMap = Record<string, EventStatus>

// Event alert for UI display
export interface EventAlert {
  id: string
  timestamp: number
  eventId: string // e.g., "roi", "line-front", "line-side"
  labels: string[]
  status: number
  thumbnail: string // base64 image
  cameraName?: string
}

// NATS stream frame data
export interface NatsStreamFrame {
  stream_id: string
  timestamp: number
  frame_number: number
  fps: number
  width: number
  height: number
  detections: Detection[]
  events?: EventsMap
  image: string // Base64 encoded JPEG
}

interface UseNatsStreamOptions {
  natsWsUrl: string | null | undefined
  natsSubject: string | null | undefined
  enabled?: boolean
  onEventTriggered?: (alert: EventAlert) => void
}

interface NatsStreamState {
  isConnected: boolean
  error: Error | null
  fps: number
  frameWidth: number
  frameHeight: number
}

export function useNatsStream({
  natsWsUrl,
  natsSubject,
  enabled = true,
  onEventTriggered,
}: UseNatsStreamOptions) {
  const [state, setState] = useState<NatsStreamState>({
    isConnected: false,
    error: null,
    fps: 0,
    frameWidth: 0,
    frameHeight: 0,
  })

  const ncRef = useRef<NatsConnection | null>(null)
  const subRef = useRef<Subscription | null>(null)
  const scRef = useRef(StringCodec())

  // Store latest frame data
  const latestFrameRef = useRef<NatsStreamFrame | null>(null)
  const imageDataUrlRef = useRef<string>('')

  // Track last alert time per event (throttle: 3 seconds per event)
  const lastAlertTimeRef = useRef<Record<string, number>>({})

  // Get latest image as data URL
  const getImageDataUrl = useCallback((): string => {
    return imageDataUrlRef.current
  }, [])

  // Get latest detections
  const getDetections = useCallback((): Detection[] => {
    return latestFrameRef.current?.detections ?? []
  }, [])

  // Get frame dimensions
  const getFrameDimensions = useCallback((): { width: number; height: number } => {
    return {
      width: latestFrameRef.current?.width ?? 0,
      height: latestFrameRef.current?.height ?? 0,
    }
  }, [])

  useEffect(() => {
    if (!enabled || !natsWsUrl || !natsSubject) {
      latestFrameRef.current = null
      imageDataUrlRef.current = ''
      return
    }

    let isMounted = true

    const connectAndSubscribe = async () => {
      try {
        const nc = await connect({ servers: natsWsUrl })
        if (!isMounted) {
          await nc.close()
          return
        }

        ncRef.current = nc
        setState((prev) => ({ ...prev, isConnected: true, error: null }))

        const sub = nc.subscribe(natsSubject)
        subRef.current = sub

        ;(async () => {
          for await (const msg of sub) {
            if (!isMounted) break
            try {
              const data: NatsStreamFrame = JSON.parse(
                scRef.current.decode(msg.data)
              )

              // Update frame data
              latestFrameRef.current = data
              imageDataUrlRef.current = `data:image/jpeg;base64,${data.image}`

              // Process events and trigger alerts
              if (data.events && onEventTriggered) {
                try {
                  const now = Date.now()
                  Object.entries(data.events).forEach(([eventId, eventStatus]) => {
                    // ROI: trigger on status 2
                    // Line: trigger on status 1 (warning) or 2 (danger)
                    const isRoi = eventId === 'roi'
                    const shouldTrigger = isRoi
                      ? eventStatus.status === 2
                      : eventStatus.status >= 1

                    if (shouldTrigger) {
                      // Throttle: 3 seconds per event
                      const lastTime = lastAlertTimeRef.current[eventId] || 0
                      if (now - lastTime >= 3000) {
                        lastAlertTimeRef.current[eventId] = now
                        onEventTriggered({
                          id: `${eventId}-${now}`,
                          timestamp: data.timestamp,
                          eventId,
                          labels: eventStatus.labels,
                          status: eventStatus.status,
                          thumbnail: data.image,
                        })
                      }
                    }
                  })
                } catch {
                  // Ignore event processing errors
                }
              }

              // Update state (throttled to avoid too many re-renders)
              setState((prev) => ({
                ...prev,
                fps: data.fps,
                frameWidth: data.width,
                frameHeight: data.height,
              }))
            } catch (e) {
              console.error('Failed to parse NATS stream message:', e)
            }
          }
        })()
      } catch (e) {
        if (isMounted) {
          console.error('NATS stream connection error:', e)
          setState((prev) => ({
            ...prev,
            isConnected: false,
            error: e instanceof Error ? e : new Error('NATS connection failed'),
          }))
        }
      }
    }

    connectAndSubscribe()

    return () => {
      isMounted = false
      if (subRef.current) {
        subRef.current.unsubscribe()
        subRef.current = null
      }
      if (ncRef.current) {
        ncRef.current.close()
        ncRef.current = null
      }
      setState((prev) => ({ ...prev, isConnected: false }))
      latestFrameRef.current = null
      imageDataUrlRef.current = ''
    }
  }, [natsWsUrl, natsSubject, enabled])

  return {
    ...state,
    getImageDataUrl,
    getDetections,
    getFrameDimensions,
  }
}
