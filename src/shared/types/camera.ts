export interface Camera {
  id: string
  name: string
  rtsp_url: string
  description?: string | null
  location?: string | null
  manufacturer?: string | null
  model?: string | null
  is_active: boolean
  created_at: string
  updated_at?: string | null
  hls_url?: string | null
  webrtc_url?: string | null
}

export interface CameraCreate {
  id: string
  name: string
  rtsp_url: string
  description?: string
  location?: string
  manufacturer?: string
  model?: string
}

export interface CameraUpdate {
  name?: string
  rtsp_url?: string
  description?: string
  location?: string
  manufacturer?: string
  model?: string
  is_active?: boolean
}

export interface CameraListResponse {
  cameras: Camera[]
  total: number
}

export interface CameraStreamStatus {
  camera_id: string
  is_ready: boolean
  is_connected: boolean
  source_ready?: boolean | null
  readers_count?: number | null
  error?: string | null
}

// UI status for video player
export type CameraPlayerStatus = 'loading' | 'playing' | 'error' | 'offline'
