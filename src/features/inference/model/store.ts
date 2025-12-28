import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Inference, GraphData } from '@shared/types'

interface InferenceState {
  // Data
  inferences: Inference[]
  currentInference: Inference | null
  previewImageUrl: string | null  // Blob URL for binary JPEG
  graphData: GraphData | null

  // UI State
  isLoading: boolean
  isLoadingPreview: boolean
  error: string | null

  // Actions
  setInferences: (inferences: Inference[]) => void
  setCurrentInference: (inference: Inference | null) => void
  setPreviewImageUrl: (url: string | null) => void
  setGraphData: (data: GraphData | null) => void
  setLoading: (loading: boolean) => void
  setLoadingPreview: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  inferences: [],
  currentInference: null,
  previewImageUrl: null,
  graphData: null,
  isLoading: false,
  isLoadingPreview: false,
  error: null,
}

export const useInferenceStore = create<InferenceState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setInferences: (inferences) => set({ inferences }),
      setCurrentInference: (inference) =>
        set({ currentInference: inference }),
      setPreviewImageUrl: (url) => {
        // Revoke old blob URL to prevent memory leaks
        const oldUrl = get().previewImageUrl
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl)
        }
        set({ previewImageUrl: url })
      },
      setGraphData: (data) => set({ graphData: data }),
      setLoading: (loading) => set({ isLoading: loading }),
      setLoadingPreview: (loading) => set({ isLoadingPreview: loading }),
      setError: (error) => set({ error }),
      reset: () => {
        // Revoke blob URL on reset
        const oldUrl = get().previewImageUrl
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl)
        }
        set(initialState)
      },
    }),
    { name: 'inference-store' }
  )
)

// Selectors
export const selectInferences = (state: InferenceState) => state.inferences
export const selectCurrentInference = (state: InferenceState) =>
  state.currentInference
export const selectPreviewImageUrl = (state: InferenceState) => state.previewImageUrl
export const selectGraphData = (state: InferenceState) => state.graphData
export const selectIsLoading = (state: InferenceState) => state.isLoading
export const selectError = (state: InferenceState) => state.error
