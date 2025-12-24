import { api } from '@shared/api/client'
import { API_CONFIG } from '@shared/config/api'
import type { Stream, StreamSettings, MxServer } from '@shared/types'

const { endpoints } = API_CONFIG

export const streamApi = {
  // Get all streams
  getAll: () => api.get<Stream[]>(endpoints.stream),

  // Get stream by ID
  getById: (id: string) => api.get<Stream>(`${endpoints.stream}/${id}`),

  // Create stream
  create: (data: Partial<Stream>) => api.post<Stream>(endpoints.stream, data),

  // Update stream
  update: (id: string, data: Partial<Stream>) =>
    api.put<Stream>(`${endpoints.stream}/${id}`, data),

  // Delete stream
  delete: (id: string) => api.delete<void>(`${endpoints.stream}/${id}`),

  // Update stream settings (masking, detection point)
  updateSettings: (id: string, settings: Partial<StreamSettings>) =>
    api.put<void>(`${endpoints.streamSettings}/${id}`, settings),

  // MX Server operations
  getMxServers: () => api.get<MxServer[]>(endpoints.mx),

  createMxServer: (data: Partial<MxServer>) =>
    api.post<MxServer>(endpoints.mx, data),

  updateMxServer: (id: string, data: Partial<MxServer>) =>
    api.put<MxServer>(`${endpoints.mx}/${id}`, data),

  deleteMxServer: (id: string) => api.delete<void>(`${endpoints.mx}/${id}`),

  // Refresh stream list from MX server
  refreshFromMx: (serverId: string) =>
    api.post<Stream[]>(`${endpoints.mx}/${serverId}/refresh`),
}
