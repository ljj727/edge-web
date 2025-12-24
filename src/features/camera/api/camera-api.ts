import { api } from '@shared/api/client'
import type {
  Camera,
  CameraCreate,
  CameraUpdate,
  CameraListResponse,
  CameraStreamStatus,
} from '@shared/types'

const CAMERAS_ENDPOINT = '/v2/cameras'

export const cameraApi = {
  // Get all cameras
  getAll: () =>
    api.get<CameraListResponse>(CAMERAS_ENDPOINT).then((res) => res.cameras),

  // Get camera by ID
  getById: (id: string) => api.get<Camera>(`${CAMERAS_ENDPOINT}/${id}`),

  // Create camera
  create: (data: CameraCreate) => api.post<Camera>(CAMERAS_ENDPOINT, data),

  // Update camera
  update: (id: string, data: CameraUpdate) =>
    api.put<Camera>(`${CAMERAS_ENDPOINT}/${id}`, data),

  // Delete camera
  delete: (id: string) => api.delete<void>(`${CAMERAS_ENDPOINT}/${id}`),

  // Get camera stream status
  getStatus: (id: string) =>
    api.get<CameraStreamStatus>(`${CAMERAS_ENDPOINT}/${id}/status`),

  // Restart camera stream
  restart: (id: string) =>
    api.post<{ success: boolean; message: string }>(
      `${CAMERAS_ENDPOINT}/${id}/restart`
    ),
}
