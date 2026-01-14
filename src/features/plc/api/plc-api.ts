import { api } from '@shared/api/client'
import type {
  PlcSettings,
  PlcSettingsRequest,
  PlcCameraSettings,
  PlcCameraSettingsRequest,
  PlcConnection,
  PlcConnectionCreate,
  PlcEventMapping,
  PlcEventMappingCreate,
  PlcEventMappingUpdate,
  PlcEventConfig,
  PlcEventConfigCreate,
  PlcEventConfigUpdate,
  PlcConnectionStatus,
  PlcSendRequest,
  PlcSendResponse,
  PlcTestResponse,
  PlcLogsResponse,
} from '@shared/types'

const ENDPOINT = '/v2/plc'

export const plcApi = {
  // ==========================================================================
  // Connection (공유 - 모든 카메라 공통)
  // ==========================================================================

  getConnection: () =>
    api.get<PlcConnection | null>(`${ENDPOINT}/connection`),

  upsertConnection: (data: PlcConnectionCreate) =>
    api.put<PlcConnection>(`${ENDPOINT}/connection`, data),

  testConnection: () =>
    api.post<PlcTestResponse>(`${ENDPOINT}/connection/test`),

  getConnectionStatus: () =>
    api.get<PlcConnectionStatus>(`${ENDPOINT}/connection/status`),

  // ==========================================================================
  // Camera Settings (카메라별 Grid 설정)
  // ==========================================================================

  getCameraSettings: (cameraId: string) =>
    api.get<PlcCameraSettings | null>(`${ENDPOINT}/cameras/${cameraId}/settings`),

  upsertCameraSettings: (cameraId: string, data: PlcCameraSettingsRequest) =>
    api.put<PlcCameraSettings>(`${ENDPOINT}/cameras/${cameraId}/settings`, data),

  // ==========================================================================
  // Camera Events (카메라별 이벤트)
  // ==========================================================================

  getCameraEvents: (cameraId: string) =>
    api.get<PlcEventConfig[]>(`${ENDPOINT}/cameras/${cameraId}/events`),

  getCameraEvent: (cameraId: string, eventType: string) =>
    api.get<PlcEventConfig>(`${ENDPOINT}/cameras/${cameraId}/events/${eventType}`),

  createCameraEvent: (cameraId: string, data: PlcEventConfigCreate) =>
    api.post<PlcEventConfig>(`${ENDPOINT}/cameras/${cameraId}/events`, data),

  updateCameraEvent: (cameraId: string, eventType: string, data: PlcEventConfigUpdate) =>
    api.put<PlcEventConfig>(`${ENDPOINT}/cameras/${cameraId}/events/${eventType}`, data),

  deleteCameraEvent: (cameraId: string, eventType: string) =>
    api.delete<void>(`${ENDPOINT}/cameras/${cameraId}/events/${eventType}`),

  seedCameraEvents: (cameraId: string) =>
    api.post<PlcEventConfig[]>(`${ENDPOINT}/cameras/${cameraId}/events/seed`),

  // ==========================================================================
  // Camera Send (카메라별 수동 전송)
  // ==========================================================================

  sendCamera: (cameraId: string, data: PlcSendRequest) =>
    api.post<PlcSendResponse>(`${ENDPOINT}/cameras/${cameraId}/send`, data),

  // ==========================================================================
  // Logs (cameraId 필터 지원)
  // ==========================================================================

  getLogs: (params?: { limit?: number; offset?: number; cameraId?: string }) =>
    api.get<PlcLogsResponse>(`${ENDPOINT}/logs`, { params }),

  // ==========================================================================
  // ⚠️ DEPRECATED: 아래 API는 카메라별 API로 대체됨
  // ==========================================================================

  /** @deprecated Use getCameraSettings instead */
  getSettings: () =>
    api.get<PlcSettings | null>(`${ENDPOINT}/settings`),

  /** @deprecated Use upsertCameraSettings instead */
  upsertSettings: (data: PlcSettingsRequest) =>
    api.put<PlcSettings>(`${ENDPOINT}/settings`, data),

  /** @deprecated Use getCameraEvents instead */
  getEvents: () =>
    api.get<PlcEventConfig[]>(`${ENDPOINT}/events`),

  /** @deprecated Use getCameraEvent instead */
  getEvent: (eventType: string) =>
    api.get<PlcEventConfig>(`${ENDPOINT}/events/${eventType}`),

  /** @deprecated Use createCameraEvent instead */
  createEvent: (data: PlcEventConfigCreate) =>
    api.post<PlcEventConfig>(`${ENDPOINT}/events`, data),

  /** @deprecated Use updateCameraEvent instead */
  updateEvent: (eventType: string, data: PlcEventConfigUpdate) =>
    api.put<PlcEventConfig>(`${ENDPOINT}/events/${eventType}`, data),

  /** @deprecated Use deleteCameraEvent instead */
  deleteEvent: (eventType: string) =>
    api.delete<void>(`${ENDPOINT}/events/${eventType}`),

  /** @deprecated Use seedCameraEvents instead */
  seedEvents: () =>
    api.post<PlcEventConfig[]>(`${ENDPOINT}/events/seed`),

  /** @deprecated Use sendCamera instead */
  send: (data: PlcSendRequest) =>
    api.post<PlcSendResponse>(`${ENDPOINT}/send`, data),

  // ==========================================================================
  // ⚠️ LEGACY: 향후 제거 예정
  // ==========================================================================

  getMappings: (addressId?: string) =>
    api.get<PlcEventMapping[]>(`${ENDPOINT}/mappings`, {
      params: addressId ? { address_id: addressId } : undefined,
    }),

  createMapping: (data: PlcEventMappingCreate) =>
    api.post<PlcEventMapping>(`${ENDPOINT}/mappings`, data),

  updateMapping: (id: string, data: PlcEventMappingUpdate) =>
    api.put<PlcEventMapping>(`${ENDPOINT}/mappings/${id}`, data),

  deleteMapping: (id: string) =>
    api.delete<void>(`${ENDPOINT}/mappings/${id}`),
}
