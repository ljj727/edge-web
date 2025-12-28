import { api } from '@shared/api/client'
import type {
  MediaMTXSettings,
  MediaMTXSettingsUpdate,
  MediaMTXConnectionTest,
} from '@shared/types'

const MEDIAMTX_ENDPOINT = '/v2/mediamtx'

export const mediamtxApi = {
  // Get current settings
  getSettings: () => api.get<MediaMTXSettings>(MEDIAMTX_ENDPOINT),

  // Update settings
  updateSettings: (data: MediaMTXSettingsUpdate) =>
    api.put<MediaMTXSettings>(MEDIAMTX_ENDPOINT, data),

  // Reset to .env defaults
  resetSettings: () =>
    api.post<MediaMTXSettings>(`${MEDIAMTX_ENDPOINT}/reset`),

  // Test connection
  testConnection: () =>
    api.post<MediaMTXConnectionTest>(`${MEDIAMTX_ENDPOINT}/test`),
}
