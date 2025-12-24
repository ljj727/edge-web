import { api } from '@shared/api/client'
import { API_CONFIG } from '@shared/config/api'
import type { Dx, DxStatus, License } from '@shared/types'

const { endpoints } = API_CONFIG

export const dxApi = {
  // Get device info
  getInfo: () => api.get<Dx>(endpoints.dx),

  // Get device status
  getStatus: () => api.get<DxStatus>(`${endpoints.dx}/status`),

  // Update device settings
  update: (data: Partial<Dx>) => api.put<Dx>(endpoints.dx, data),

  // Restart device
  restart: () => api.post<void>(`${endpoints.dx}/restart`),

  // License operations
  getLicense: () => api.get<License>(endpoints.license),

  activateLicense: (key: string) =>
    api.post<License>(`${endpoints.license}/activate`, { key }),

  deactivateLicense: () => api.post<void>(`${endpoints.license}/deactivate`),
}
