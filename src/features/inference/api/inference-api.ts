import { api } from '@shared/api/client'
import { API_CONFIG } from '@shared/config/api'
import type { Inference, InferenceSettings, PreviewImage } from '@shared/types'

const { endpoints } = API_CONFIG

export const inferenceApi = {
  // Get all inferences for a video
  getByVideoId: (videoId: string) =>
    api.get<Inference[]>(`${endpoints.inference}?videoId=${videoId}`),

  // Get all inferences
  getAll: () => api.get<Inference[]>(endpoints.inference),

  // Create new inference
  create: (videoId: string, data: Partial<Inference>) =>
    api.post<Inference>(`${endpoints.inference}?videoId=${videoId}`, data),

  // Update inference
  update: (appId: string, videoId: string, data: Partial<Inference>) =>
    api.put<Inference>(
      `${endpoints.inference}?appId=${appId}&videoId=${videoId}`,
      data
    ),

  // Delete inference
  delete: (appId: string, videoId: string) =>
    api.delete<void>(
      `${endpoints.inference}?appId=${appId}&videoId=${videoId}`
    ),

  // Update event settings (graph configuration)
  updateEventSettings: (
    appId: string,
    videoId: string,
    settings: InferenceSettings,
    nodeSettings: string
  ) =>
    api.put<void>(
      `${endpoints.inferenceEventSetting}?appId=${appId}&videoId=${videoId}`,
      { settings, nodeSettings }
    ),

  // Get preview image
  getPreview: (appId: string, videoId: string) =>
    api.get<PreviewImage>(
      `${endpoints.inferencePreview}?appId=${appId}&videoId=${videoId}`
    ),

  // Start inference
  start: (appId: string, videoId: string) =>
    api.post<void>(
      `${endpoints.inference}/start?appId=${appId}&videoId=${videoId}`
    ),

  // Stop inference
  stop: (appId: string, videoId: string) =>
    api.post<void>(
      `${endpoints.inference}/stop?appId=${appId}&videoId=${videoId}`
    ),

  // Get HLS stream with WebSocket port
  getHlsConfig: (uri: string, appId: string, videoId: string) =>
    api.get<{ wsPort: number }>(
      `${endpoints.inference}/hls?uri=${uri}&appId=${appId}&videoId=${videoId}`
    ),
}
