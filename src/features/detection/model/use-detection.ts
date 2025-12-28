import { useEffect, useRef, useState, useCallback } from 'react'
import { connect, StringCodec } from 'nats.ws'
import type { NatsConnection, Subscription } from 'nats.ws'
import type { DetectionObject, DetectionResult } from '@shared/types'

const NATS_URL = 'ws://aict.snuailab.ai:20416'

// Buffer retention time in ms
const BUFFER_RETENTION_MS = 5000

interface BufferedDetection {
  timestamp: number // nanoseconds
  objects: DetectionObject[]
}

interface UseDetectionOptions {
  streamId: string
  enabled?: boolean
}

export function useDetection({ streamId, enabled = true }: UseDetectionOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const ncRef = useRef<NatsConnection | null>(null)
  const subRef = useRef<Subscription | null>(null)
  const scRef = useRef(StringCodec())

  // Detection buffer for timestamp-based sync
  const bufferRef = useRef<BufferedDetection[]>([])
  const latestObjectsRef = useRef<DetectionObject[]>([])

  // Clean old detections from buffer
  const cleanBuffer = useCallback(() => {
    const now = Date.now() * 1e6 // Convert to nanoseconds
    const cutoff = now - BUFFER_RETENTION_MS * 1e6
    bufferRef.current = bufferRef.current.filter(d => d.timestamp > cutoff)
  }, [])

  // Find closest detection for given timestamp (in nanoseconds)
  const getDetectionForTimestamp = useCallback((timestampNs: number): DetectionObject[] => {
    const buffer = bufferRef.current
    if (buffer.length === 0) return []

    // Find closest detection
    let closest = buffer[0]
    let minDiff = Math.abs(buffer[0].timestamp - timestampNs)

    for (const detection of buffer) {
      const diff = Math.abs(detection.timestamp - timestampNs)
      if (diff < minDiff) {
        minDiff = diff
        closest = detection
      }
    }

    // Only return if within reasonable time window (100ms = 100_000_000 ns)
    if (minDiff < 100_000_000) {
      return closest.objects
    }

    return []
  }, [])

  // Get latest detection (for fallback)
  const getLatestDetection = useCallback((): DetectionObject[] => {
    return latestObjectsRef.current
  }, [])

  useEffect(() => {
    if (!enabled || !streamId) {
      bufferRef.current = []
      latestObjectsRef.current = []
      return
    }

    let isMounted = true

    const connectAndSubscribe = async () => {
      try {
        const nc = await connect({ servers: NATS_URL })
        if (!isMounted) {
          await nc.close()
          return
        }

        ncRef.current = nc
        setIsConnected(true)
        setError(null)

        const topic = `inference.result.${streamId}`
        const sub = nc.subscribe(topic)
        subRef.current = sub

        ;(async () => {
          for await (const msg of sub) {
            if (!isMounted) break
            try {
              const data: DetectionResult = JSON.parse(scRef.current.decode(msg.data))

              // Add to buffer with timestamp
              bufferRef.current.push({
                timestamp: data.metadata.timestamp,
                objects: data.objects,
              })

              // Update latest
              latestObjectsRef.current = data.objects

              // Clean old entries periodically
              if (bufferRef.current.length > 100) {
                cleanBuffer()
              }
            } catch (e) {
              console.error('Failed to parse detection message:', e)
            }
          }
        })()
      } catch (e) {
        if (isMounted) {
          console.error('NATS connection error:', e)
          setError(e instanceof Error ? e : new Error('NATS connection failed'))
          setIsConnected(false)
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
      setIsConnected(false)
      bufferRef.current = []
      latestObjectsRef.current = []
    }
  }, [streamId, enabled, cleanBuffer])

  return {
    isConnected,
    error,
    getDetectionForTimestamp,
    getLatestDetection,
  }
}
