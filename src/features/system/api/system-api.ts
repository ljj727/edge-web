import { api } from '@shared/api/client'
import { API_CONFIG } from '@shared/config/api'
import type { SystemHealth, SystemSyncResult, SystemStatus } from '@shared/types'

const { endpoints } = API_CONFIG

export const systemApi = {
  // Check system health (Core, MediaMTX, NATS, DB)
  getHealth: () => api.get<SystemHealth>(`${endpoints.system}/health`),

  // Sync all data (cameras, apps, inferences)
  syncAll: () => api.post<SystemSyncResult>(`${endpoints.system}/sync-all`),

  // Get system status (counts, disk usage, etc.)
  getStatus: () => api.get<SystemStatus>(`${endpoints.system}/status`),

  // Individual sync endpoints (optional)
  syncCameras: () => api.post<{ synced: number }>(`${endpoints.system}/cameras/sync`),
  syncApps: () => api.post<{ synced: number }>(`${endpoints.system}/apps/sync`),
  syncInferences: () => api.post<{ synced: number }>(`${endpoints.system}/inference/sync`),
}
