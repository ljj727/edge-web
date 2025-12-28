import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { systemApi } from '../api/system-api'

// Query keys
export const systemKeys = {
  all: ['system'] as const,
  health: () => [...systemKeys.all, 'health'] as const,
  status: () => [...systemKeys.all, 'status'] as const,
}

// Get system health
export function useSystemHealth(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: systemKeys.health(),
    queryFn: systemApi.getHealth,
    ...options,
  })
}

// Get system status
export function useSystemStatus() {
  return useQuery({
    queryKey: systemKeys.status(),
    queryFn: systemApi.getStatus,
  })
}

// Sync all data
export function useSyncAll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: systemApi.syncAll,
    onSuccess: () => {
      // Invalidate all related queries after sync
      queryClient.invalidateQueries({ queryKey: ['cameras'] })
      queryClient.invalidateQueries({ queryKey: ['apps'] })
      queryClient.invalidateQueries({ queryKey: ['inference'] })
      queryClient.invalidateQueries({ queryKey: systemKeys.status() })
    },
  })
}

// Full restart flow hook
export function useSystemRestart() {
  const queryClient = useQueryClient()
  const syncMutation = useSyncAll()

  const restart = async (onProgress?: (step: RestartStep) => void) => {
    try {
      // Step 1: Check health
      onProgress?.({ step: 'health', status: 'loading', message: 'Checking system health...' })
      try {
        const health = await systemApi.getHealth()
        if (!health?.healthy) {
          onProgress?.({ step: 'health', status: 'error', message: 'System health check failed' })
          return { success: false, error: 'Health check failed', health }
        }
        onProgress?.({ step: 'health', status: 'success', message: 'System healthy' })
      } catch (e) {
        onProgress?.({ step: 'health', status: 'error', message: `Health check error: ${e}` })
        return { success: false, error: String(e) }
      }

      // Step 2: Sync all
      onProgress?.({ step: 'sync', status: 'loading', message: 'Syncing data...' })
      try {
        const syncResult = await syncMutation.mutateAsync()
        const synced = syncResult?.synced
        const syncMsg = synced
          ? `Synced: ${synced.cameras ?? 0} cameras, ${synced.apps ?? 0} apps, ${synced.inferences ?? 0} inferences`
          : 'Sync completed'
        onProgress?.({ step: 'sync', status: 'success', message: syncMsg })
      } catch (e) {
        onProgress?.({ step: 'sync', status: 'error', message: `Sync error: ${e}` })
        return { success: false, error: String(e) }
      }

      // Step 3: Get status
      onProgress?.({ step: 'status', status: 'loading', message: 'Loading system status...' })
      try {
        await systemApi.getStatus()
        onProgress?.({ step: 'status', status: 'success', message: 'System ready' })
      } catch (e) {
        // Status is optional, just warn
        onProgress?.({ step: 'status', status: 'success', message: 'System ready (status unavailable)' })
      }

      // Invalidate all queries to refresh UI
      queryClient.invalidateQueries()

      return { success: true }
    } catch (error) {
      onProgress?.({ step: 'error', status: 'error', message: String(error) })
      return { success: false, error: String(error) }
    }
  }

  return {
    restart,
    isLoading: syncMutation.isPending,
  }
}

export interface RestartStep {
  step: 'health' | 'sync' | 'status' | 'error'
  status: 'loading' | 'success' | 'error'
  message: string
}
