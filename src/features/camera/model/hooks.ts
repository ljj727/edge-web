import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCameraStore } from './store'
import { cameraApi } from '../api/camera-api'
import type { CameraCreate, CameraUpdate } from '@shared/types'

const QUERY_KEYS = {
  cameras: ['cameras'] as const,
  camera: (id: string) => ['cameras', id] as const,
  status: (id: string) => ['cameras', id, 'status'] as const,
}

// Query hooks
export function useCameras() {
  const setCameras = useCameraStore((state) => state.setCameras)

  return useQuery({
    queryKey: QUERY_KEYS.cameras,
    queryFn: cameraApi.getAll,
    staleTime: 30000,
    select: (data) => {
      setCameras(data)
      return data
    },
  })
}

export function useCamera(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.camera(id),
    queryFn: () => cameraApi.getById(id),
    enabled: !!id,
  })
}

export function useCameraStatus(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.status(id),
    queryFn: () => cameraApi.getStatus(id),
    enabled: !!id,
    refetchInterval: 5000, // Poll every 5 seconds
  })
}

// Mutation hooks
export function useCreateCamera() {
  const queryClient = useQueryClient()
  const addCamera = useCameraStore((state) => state.addCamera)
  const setFormOpen = useCameraStore((state) => state.setFormOpen)

  return useMutation({
    mutationFn: (data: CameraCreate) => cameraApi.create(data),
    onSuccess: (newCamera) => {
      addCamera(newCamera)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cameras })
      setFormOpen(false)
    },
  })
}

export function useUpdateCamera() {
  const queryClient = useQueryClient()
  const updateCamera = useCameraStore((state) => state.updateCamera)

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CameraUpdate }) =>
      cameraApi.update(id, data),
    onSuccess: (updatedCamera) => {
      updateCamera(updatedCamera.id, updatedCamera)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cameras })
    },
  })
}

export function useDeleteCamera() {
  const queryClient = useQueryClient()
  const removeCamera = useCameraStore((state) => state.removeCamera)

  return useMutation({
    mutationFn: (id: string) => cameraApi.delete(id),
    onSuccess: (_, id) => {
      removeCamera(id)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cameras })
    },
  })
}
