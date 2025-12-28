import { api, apiClient } from '@shared/api/client'
import { API_CONFIG } from '@shared/config/api'
import type { App, AppDeleteResponse } from '@shared/types'

const APPS_ENDPOINT = '/v2/apps'

export const appApi = {
  // Get all apps - returns App[] directly
  getAll: () => api.get<App[]>(APPS_ENDPOINT),

  // Get app by ID
  getById: (id: string) => api.get<App>(`${APPS_ENDPOINT}/${id}`),

  // Upload new app (zip file) - returns App (AppDTO)
  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post<App>(APPS_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    }).then((res) => res.data)
  },

  // Update app (zip file)
  update: (id: string, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.put<App>(`${APPS_ENDPOINT}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    }).then((res) => res.data)
  },

  // Delete app - returns {status, message}
  delete: (id: string) => api.delete<AppDeleteResponse>(`${APPS_ENDPOINT}/${id}`),

  // Get app cover image URL
  getCoverUrl: (id: string) => `${API_CONFIG.baseURL}${APPS_ENDPOINT}/${id}/cover`,
}
