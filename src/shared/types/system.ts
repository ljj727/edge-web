// System Health Check Response
export interface SystemHealth {
  healthy: boolean
  services: {
    core: boolean
    mediamtx: boolean
    nats: boolean
    database: boolean
  }
  timestamp: string
}

// System Sync Response
export interface SystemSyncResult {
  success: boolean
  synced: {
    cameras: number
    apps: number
    inferences: number
  }
  errors?: string[]
}

// System Status Response
export interface SystemStatus {
  apps_count: number
  cameras_count: number
  inferences_count: number
  events_count: number
  disk_usage: {
    total_gb: number
    used_gb: number
    free_gb: number
    percent: number
  }
  uptime_seconds: number
}
