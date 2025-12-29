import { useEffect, useRef, useState, useCallback } from 'react'
import { connect, StringCodec } from 'nats.ws'
import type { NatsConnection, Subscription } from 'nats.ws'
import type { DetectionObject, DetectionResult } from '@shared/types'

const NATS_URL = 'ws://aict.snuailab.ai:20416'

// How long to keep app detections before considering them stale (ms)
const APP_STALE_TIMEOUT_MS = 500

interface AppDetection {
  objects: DetectionObject[]
  lastUpdate: number // Date.now() in ms
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

  // Store detections per app_id for multi-app support
  const appDetectionsRef = useRef<Map<string, AppDetection>>(new Map())

  // Get merged detections from all active apps
  const getLatestDetection = useCallback((): DetectionObject[] => {
    const now = Date.now()
    const allObjects: DetectionObject[] = []

    // Merge all non-stale app detections
    for (const [appId, detection] of appDetectionsRef.current) {
      if (now - detection.lastUpdate < APP_STALE_TIMEOUT_MS) {
        allObjects.push(...detection.objects)
      } else {
        // Clean up stale app data
        appDetectionsRef.current.delete(appId)
      }
    }

    return allObjects
  }, [])

  useEffect(() => {
    if (!enabled || !streamId) {
      appDetectionsRef.current.clear()
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

              // Store detection by app_id for multi-app merging
              appDetectionsRef.current.set(data.metadata.app_id, {
                objects: data.objects,
                lastUpdate: Date.now(),
              })
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
      appDetectionsRef.current.clear()
    }
  }, [streamId, enabled])

  return {
    isConnected,
    error,
    getLatestDetection,
  }
}
