import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { plcApi } from '../api/plc-api'
import type {
  PlcSettingsRequest,
  PlcCameraSettingsRequest,
  PlcConnectionCreate,
  PlcEventMappingCreate,
  PlcEventMappingUpdate,
  PlcEventConfigCreate,
  PlcEventConfigUpdate,
  PlcSendRequest,
} from '@shared/types'

// =============================================================================
// Query Keys
// =============================================================================

export const PLC_QUERY_KEYS = {
  settings: ['plc', 'settings'] as const,
  connection: ['plc', 'connection'] as const,
  connectionStatus: ['plc', 'connection', 'status'] as const,
  events: ['plc', 'events'] as const,
  addresses: (connectionId?: string) => ['plc', 'addresses', connectionId] as const,
  mappings: (addressId?: string) => ['plc', 'mappings', addressId] as const,
  logs: (limit?: number, offset?: number) => ['plc', 'logs', limit, offset] as const,
  // Camera-specific
  cameraSettings: (cameraId: string) => ['plc', 'cameras', cameraId, 'settings'] as const,
  cameraEvents: (cameraId: string) => ['plc', 'cameras', cameraId, 'events'] as const,
  cameraAvailableEvents: (cameraId: string) => ['plc', 'cameras', cameraId, 'available-events'] as const,
}

// =============================================================================
// Settings Hooks (Grid 설정)
// =============================================================================

export function usePlcSettings() {
  return useQuery({
    queryKey: PLC_QUERY_KEYS.settings,
    queryFn: plcApi.getSettings,
    staleTime: 30000,
  })
}

export function useSavePlcSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PlcSettingsRequest) => plcApi.upsertSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLC_QUERY_KEYS.settings })
    },
  })
}

// =============================================================================
// Camera Settings Hooks (카메라별 Grid 설정)
// =============================================================================

export function usePlcCameraSettings(cameraId: string | null) {
  return useQuery({
    queryKey: PLC_QUERY_KEYS.cameraSettings(cameraId || ''),
    queryFn: () => plcApi.getCameraSettings(cameraId!),
    enabled: !!cameraId,
    staleTime: 30000,
  })
}

export function useSavePlcCameraSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cameraId, data }: { cameraId: string; data: PlcCameraSettingsRequest }) =>
      plcApi.upsertCameraSettings(cameraId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PLC_QUERY_KEYS.cameraSettings(variables.cameraId) })
    },
  })
}

// =============================================================================
// Camera Events Hooks (카메라별 이벤트)
// =============================================================================

export function usePlcCameraEvents(cameraId: string | null) {
  return useQuery({
    queryKey: PLC_QUERY_KEYS.cameraEvents(cameraId || ''),
    queryFn: () => plcApi.getCameraEvents(cameraId!),
    enabled: !!cameraId,
    staleTime: 30000,
  })
}

export function useCreatePlcCameraEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cameraId, data }: { cameraId: string; data: PlcEventConfigCreate }) =>
      plcApi.createCameraEvent(cameraId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PLC_QUERY_KEYS.cameraEvents(variables.cameraId) })
    },
  })
}

export function useUpdatePlcCameraEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cameraId, eventType, data }: { cameraId: string; eventType: string; data: PlcEventConfigUpdate }) =>
      plcApi.updateCameraEvent(cameraId, eventType, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PLC_QUERY_KEYS.cameraEvents(variables.cameraId) })
    },
  })
}

export function useDeletePlcCameraEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cameraId, eventType }: { cameraId: string; eventType: string }) =>
      plcApi.deleteCameraEvent(cameraId, eventType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PLC_QUERY_KEYS.cameraEvents(variables.cameraId) })
    },
  })
}

export function useSeedPlcCameraEvents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cameraId: string) => plcApi.seedCameraEvents(cameraId),
    onSuccess: (_, cameraId) => {
      queryClient.invalidateQueries({ queryKey: PLC_QUERY_KEYS.cameraEvents(cameraId) })
    },
  })
}

export function usePlcAvailableEvents(cameraId: string | null) {
  return useQuery({
    queryKey: PLC_QUERY_KEYS.cameraAvailableEvents(cameraId || ''),
    queryFn: () => plcApi.getAvailableEvents(cameraId!),
    enabled: !!cameraId,
    staleTime: 30000,
  })
}

export function usePlcCameraSend() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cameraId, data }: { cameraId: string; data: PlcSendRequest }) =>
      plcApi.sendCamera(cameraId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plc', 'logs'] })
    },
  })
}

// =============================================================================
// Single Connection Hooks (New API)
// =============================================================================

export function usePlcConnection() {
  return useQuery({
    queryKey: PLC_QUERY_KEYS.connection,
    queryFn: plcApi.getConnection,
    staleTime: 30000,
  })
}

export function useSavePlcConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PlcConnectionCreate) => plcApi.upsertConnection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLC_QUERY_KEYS.connection })
      queryClient.invalidateQueries({ queryKey: PLC_QUERY_KEYS.connectionStatus })
    },
  })
}

export function useTestPlcConnection() {
  return useMutation({
    mutationFn: () => plcApi.testConnection(),
  })
}

export function usePlcConnectionStatus() {
  return useQuery({
    queryKey: PLC_QUERY_KEYS.connectionStatus,
    queryFn: plcApi.getConnectionStatus,
    refetchInterval: 5000,
  })
}

// =============================================================================
// Event Config Hooks (New API)
// =============================================================================

export function usePlcEvents() {
  return useQuery({
    queryKey: PLC_QUERY_KEYS.events,
    queryFn: plcApi.getEvents,
    staleTime: 30000,
  })
}

export function useUpdatePlcEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventType, data }: { eventType: string; data: PlcEventConfigUpdate }) =>
      plcApi.updateEvent(eventType, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLC_QUERY_KEYS.events })
    },
  })
}

export function useSeedPlcEvents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => plcApi.seedEvents(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLC_QUERY_KEYS.events })
    },
  })
}

// =============================================================================
// Mapping Hooks (Legacy)
// =============================================================================

export function usePlcMappings(addressId?: string) {
  return useQuery({
    queryKey: PLC_QUERY_KEYS.mappings(addressId),
    queryFn: () => plcApi.getMappings(addressId),
    staleTime: 30000,
  })
}

export function useCreatePlcMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PlcEventMappingCreate) => plcApi.createMapping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plc', 'mappings'] })
    },
  })
}

export function useUpdatePlcMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PlcEventMappingUpdate }) =>
      plcApi.updateMapping(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plc', 'mappings'] })
    },
  })
}

export function useDeletePlcMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => plcApi.deleteMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plc', 'mappings'] })
    },
  })
}

// =============================================================================
// Send & Logs Hooks
// =============================================================================

export function usePlcSend() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PlcSendRequest) => plcApi.send(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plc', 'logs'] })
    },
  })
}

export function usePlcLogs(limit = 50, offset = 0, cameraId?: string) {
  return useQuery({
    queryKey: [...PLC_QUERY_KEYS.logs(limit, offset), cameraId],
    queryFn: () => plcApi.getLogs({ limit, offset, cameraId }),
    staleTime: 10000,
  })
}
