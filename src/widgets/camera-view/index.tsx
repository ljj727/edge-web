import { useRef, useEffect, useState } from 'react'
import { X, Maximize2, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { Camera, CameraPlayerStatus } from '@shared/types'

interface CameraViewProps {
  camera: Camera
  onRemove?: (id: string) => void
  onMaximize?: (id: string) => void
  className?: string
  showControls?: boolean
}

export function CameraView({
  camera,
  onRemove,
  onMaximize,
  className,
  showControls = true,
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const [status, setStatus] = useState<CameraPlayerStatus>('loading')
  const [isMuted, setIsMuted] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Handle missing WebRTC URL
    if (!camera.webrtc_url) {
      setStatus('offline')
      return
    }

    let isMounted = true
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let currentRetry = 0

    const connect = async () => {
      if (!isMounted) return

      try {
        setStatus('loading')

        // Close existing connection
        if (pcRef.current) {
          pcRef.current.close()
          pcRef.current = null
        }

        // Create RTCPeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        })
        pcRef.current = pc

        // Handle incoming media tracks
        pc.ontrack = (event) => {
          if (isMounted && video) {
            video.srcObject = event.streams[0]
            video.play().catch(() => {})
            setStatus('playing')
            currentRetry = 0
            setRetryCount(0)
          }
        }

        // Monitor connection state
        pc.onconnectionstatechange = () => {
          if (!isMounted) return

          if (
            pc.connectionState === 'failed' ||
            pc.connectionState === 'disconnected'
          ) {
            setStatus('error')
            // Retry after 5 seconds (max 3 retries)
            if (currentRetry < 3) {
              currentRetry++
              setRetryCount(currentRetry)
              retryTimeout = setTimeout(() => {
                if (isMounted) connect()
              }, 5000)
            } else {
              setStatus('offline')
            }
          }
        }

        // Add transceivers for receiving video and audio
        pc.addTransceiver('video', { direction: 'recvonly' })
        pc.addTransceiver('audio', { direction: 'recvonly' })

        // Create offer
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        // Send WHEP request to MediaMTX
        const response = await fetch(camera.webrtc_url!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: pc.localDescription?.sdp,
        })

        if (!response.ok) {
          throw new Error(`WHEP request failed: ${response.status}`)
        }

        // Apply answer
        const answer = await response.text()
        await pc.setRemoteDescription({
          type: 'answer',
          sdp: answer,
        })
      } catch (error) {
        console.error(`WebRTC connection error for ${camera.name}:`, error)
        if (isMounted) {
          setStatus('error')
          // Retry after 5 seconds
          if (currentRetry < 3) {
            currentRetry++
            setRetryCount(currentRetry)
            retryTimeout = setTimeout(() => {
              if (isMounted) connect()
            }, 5000)
          } else {
            setStatus('offline')
          }
        }
      }
    }

    connect()

    return () => {
      isMounted = false
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }
    }
  }, [camera.webrtc_url, camera.name])

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
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
    error: 'Reconnecting...',
    offline: 'Offline',
  }

  return (
    <div
      className={cn(
        'relative bg-black rounded-lg overflow-hidden group',
        className
      )}
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
        {status !== 'playing' && (
          <span className="text-white text-xs bg-black/60 px-2 py-1 rounded">
            {statusLabels[status]}
          </span>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleMute}
            className="bg-black/60 text-white p-1.5 rounded hover:bg-black/80 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
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
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover"
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

      {/* Error overlay */}
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
              {status === 'error' ? 'Connection Lost' : 'Camera Offline'}
            </span>
            <span className="text-gray-400 text-xs">
              {status === 'error'
                ? `Retrying... (${retryCount}/3)`
                : 'Check camera connection'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
