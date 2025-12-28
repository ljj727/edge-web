import { api, apiClient } from '@shared/api/client'
import { API_CONFIG } from '@shared/config/api'
import type { Inference, InferenceSettings, StreamResponse, InferenceStatusResponse } from '@shared/types'

const { endpoints } = API_CONFIG

export interface CreateInferenceRequest {
  appId: string
  videoId: string
  uri: string
  name: string
  settings: InferenceSettings
}

export const inferenceApi = {
  // Get all inferences for a video
  getByVideoId: (videoId: string) =>
    api.get<Inference[]>(`${endpoints.inference}?videoId=${videoId}`),

  // Get all inferences
  getAll: () => api.get<Inference[]>(endpoints.inference),

  // Create new inference (also starts it)
  create: (data: CreateInferenceRequest) =>
    api.post<Inference>(endpoints.inference, data),

  // Update inference
  update: (appId: string, videoId: string, data: Partial<Inference>) =>
    api.put<Inference>(
      `${endpoints.inference}?appId=${appId}&videoId=${videoId}`,
      data
    ),

  // Delete inference (also stops it)
  delete: (appId: string, videoId: string) =>
    api.delete<void>(
      `${endpoints.inference}?appId=${appId}&videoId=${videoId}`
    ),

  // Update event settings (graph configuration)
  updateEventSettings: (
    appId: string,
    videoId: string,
    settings: InferenceSettings
  ) =>
    api.put<void>(
      `${endpoints.inferenceEventSetting}?appId=${appId}&videoId=${videoId}`,
      { settings }
    ),

  // Get preview image - returns binary JPEG blob
  getPreview: async (appId: string, videoId: string): Promise<string> => {
    const response = await apiClient.get(
      `${endpoints.inferencePreview}?appId=${appId}&videoId=${videoId}`,
      { responseType: 'blob' }
    )
    // Create blob URL from binary response
    return URL.createObjectURL(response.data)
  },

  // Start stream - returns HLS location
  startStream: (appId: string, videoId: string, uri: string) =>
    api.post<StreamResponse>(
      `${endpoints.inferenceStream}?appId=${appId}&videoId=${videoId}&uri=${encodeURIComponent(uri)}`
    ),

  // Stop stream
  stopStream: (sessionId: string) =>
    api.delete<void>(`${endpoints.inferenceStream}?sessionId=${sessionId}`),

  // Get all inference statuses (backend returns int status codes)
  getAllStatus: () => api.get<InferenceStatusResponse[]>(endpoints.inferenceStatus),

  // Get specific inference status
  getStatus: (appId: string, videoId: string) =>
    api.get<InferenceStatusResponse>(
      `${endpoints.inferenceStatus}?appId=${appId}&videoId=${videoId}`
    ),
}
