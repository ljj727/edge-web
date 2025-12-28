import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from './store'
import { appApi } from '../api/app-api'

const QUERY_KEYS = {
  apps: ['apps'] as const,
  app: (id: string) => ['apps', id] as const,
}

// Query hooks
export function useApps() {
  const setApps = useAppStore((state) => state.setApps)

  return useQuery({
    queryKey: QUERY_KEYS.apps,
    queryFn: appApi.getAll,
    staleTime: 30000,
    select: (data) => {
      setApps(data)
      return data
    },
  })
}

export function useApp(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.app(id),
    queryFn: () => appApi.getById(id),
    enabled: !!id,
  })
}

// Mutation hooks
export function useUploadApp() {
  const queryClient = useQueryClient()
  const setUploadDialogOpen = useAppStore((state) => state.setUploadDialogOpen)
  const setUploadProgress = useAppStore((state) => state.setUploadProgress)

  return useMutation({
    mutationFn: (file: File) => appApi.upload(file, setUploadProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.apps })
      setUploadDialogOpen(false)
      setUploadProgress(0)
    },
    onError: () => {
      setUploadProgress(0)
    },
  })
}

export function useUpdateApp() {
  const queryClient = useQueryClient()
  const setUploadProgress = useAppStore((state) => state.setUploadProgress)

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      appApi.update(id, file, setUploadProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.apps })
      setUploadProgress(0)
    },
    onError: () => {
      setUploadProgress(0)
    },
  })
}

export function useDeleteApp() {
  const queryClient = useQueryClient()
  const removeApp = useAppStore((state) => state.removeApp)

  return useMutation({
    mutationFn: (id: string) => appApi.delete(id),
    onSuccess: (_, id) => {
      removeApp(id)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.apps })
    },
  })
}
