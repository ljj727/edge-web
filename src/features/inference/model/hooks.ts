import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useInferenceStore } from './store'
import { inferenceApi } from '../api/inference-api'
import type { Inference, InferenceSettings } from '@shared/types'

const QUERY_KEYS = {
  inferences: ['inferences'] as const,
  inferencesByVideo: (videoId: string) => ['inferences', videoId] as const,
  preview: (appId: string, videoId: string) =>
    ['inference-preview', appId, videoId] as const,
}

// Query hooks
export function useInferences() {
  const setInferences = useInferenceStore((state) => state.setInferences)

  return useQuery({
    queryKey: QUERY_KEYS.inferences,
    queryFn: inferenceApi.getAll,
    staleTime: 30000,
    select: (data) => {
      setInferences(data)
      return data
    },
  })
}

export function useInferencesByVideo(videoId: string) {
  const setInferences = useInferenceStore((state) => state.setInferences)

  return useQuery({
    queryKey: QUERY_KEYS.inferencesByVideo(videoId),
    queryFn: () => inferenceApi.getByVideoId(videoId),
    enabled: !!videoId,
    staleTime: 30000,
    select: (data) => {
      setInferences(data)
      return data
    },
  })
}

export function useInferencePreview(appId: string, videoId: string) {
  const setPreviewImage = useInferenceStore((state) => state.setPreviewImage)
  const setLoadingPreview = useInferenceStore(
    (state) => state.setLoadingPreview
  )

  return useQuery({
    queryKey: QUERY_KEYS.preview(appId, videoId),
    queryFn: () => inferenceApi.getPreview(appId, videoId),
    enabled: !!appId && !!videoId,
    staleTime: 60000,
    select: (data) => {
      setPreviewImage(data)
      setLoadingPreview(false)
      return data
    },
  })
}

// Mutation hooks
export function useCreateInference() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      videoId,
      data,
    }: {
      videoId: string
      data: Partial<Inference>
    }) => inferenceApi.create(videoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inferences })
    },
  })
}

export function useUpdateInference() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      appId,
      videoId,
      data,
    }: {
      appId: string
      videoId: string
      data: Partial<Inference>
    }) => inferenceApi.update(appId, videoId, data),
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.inferencesByVideo(videoId),
      })
    },
  })
}

export function useDeleteInference() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appId, videoId }: { appId: string; videoId: string }) =>
      inferenceApi.delete(appId, videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inferences })
    },
  })
}

export function useUpdateEventSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      appId,
      videoId,
      settings,
      nodeSettings,
    }: {
      appId: string
      videoId: string
      settings: InferenceSettings
      nodeSettings: string
    }) => inferenceApi.updateEventSettings(appId, videoId, settings, nodeSettings),
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.inferencesByVideo(videoId),
      })
    },
  })
}

export function useStartInference() {
  return useMutation({
    mutationFn: ({ appId, videoId }: { appId: string; videoId: string }) =>
      inferenceApi.start(appId, videoId),
  })
}

export function useStopInference() {
  return useMutation({
    mutationFn: ({ appId, videoId }: { appId: string; videoId: string }) =>
      inferenceApi.stop(appId, videoId),
  })
}
