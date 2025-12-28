import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mediamtxApi } from '../api/mediamtx-api'
import type { MediaMTXSettingsUpdate } from '@shared/types'

const QUERY_KEYS = {
  settings: ['mediamtx-settings'] as const,
}

// Query hooks
export function useMediaMTXSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: mediamtxApi.getSettings,
    staleTime: 60000, // 1 minute
  })
}

// Mutation hooks
export function useUpdateMediaMTXSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MediaMTXSettingsUpdate) =>
      mediamtxApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings })
    },
  })
}

export function useResetMediaMTXSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => mediamtxApi.resetSettings(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings })
    },
  })
}

export function useTestMediaMTXConnection() {
  return useMutation({
    mutationFn: () => mediamtxApi.testConnection(),
  })
}
