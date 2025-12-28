import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useInferenceStore } from './store'
import { inferenceApi } from '../api/inference-api'
import type { CreateInferenceRequest } from '../api/inference-api'
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

// Preview hook - returns blob URL for binary JPEG
export function useInferencePreview(appId: string, videoId: string) {
  const setPreviewImageUrl = useInferenceStore((state) => state.setPreviewImageUrl)
  const setLoadingPreview = useInferenceStore(
    (state) => state.setLoadingPreview
  )

  return useQuery({
    queryKey: QUERY_KEYS.preview(appId, videoId),
    queryFn: () => inferenceApi.getPreview(appId, videoId),
    enabled: !!appId && !!videoId,
    staleTime: 60000,
    select: (blobUrl) => {
      setPreviewImageUrl(blobUrl)
      setLoadingPreview(false)
      return blobUrl
    },
  })
}

// Mutation hooks
export function useCreateInference() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInferenceRequest) => inferenceApi.create(data),
    onSuccess: (_, { videoId }) => {
      // Invalidate both general and video-specific queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inferences })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inferencesByVideo(videoId) })
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
    onSuccess: (_, { videoId }) => {
      // Invalidate both general and video-specific queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inferences })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inferencesByVideo(videoId) })
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
    }: {
      appId: string
      videoId: string
      settings: InferenceSettings
    }) => inferenceApi.updateEventSettings(appId, videoId, settings),
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.inferencesByVideo(videoId),
      })
    },
  })
}

// Stream hooks
export function useStartStream() {
  return useMutation({
    mutationFn: ({ appId, videoId, uri }: { appId: string; videoId: string; uri: string }) =>
      inferenceApi.startStream(appId, videoId, uri),
  })
}

export function useStopStream() {
  return useMutation({
    mutationFn: (sessionId: string) => inferenceApi.stopStream(sessionId),
  })
}

// Legacy aliases for backward compatibility
export const useStartInference = useStartStream
export const useStopInference = useStopStream
