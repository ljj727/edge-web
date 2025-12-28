// MediaMTX settings types

export interface MediaMTXSettings {
  id: number
  api_url: string
  hls_url: string
  webrtc_url: string
  rtsp_url: string
  enabled: boolean
  created_at: string
  updated_at: string | null
}

export interface MediaMTXSettingsUpdate {
  api_url?: string
  hls_url?: string
  webrtc_url?: string
  rtsp_url?: string
  enabled?: boolean
}

export interface MediaMTXConnectionTest {
  success: boolean
  message: string
  streams_count?: number
  latency_ms?: number
}
