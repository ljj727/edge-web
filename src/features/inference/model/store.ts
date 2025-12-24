import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  Inference,
  PreviewImage,
  GraphData,
} from '@shared/types'

interface InferenceState {
  // Data
  inferences: Inference[]
  currentInference: Inference | null
  previewImage: PreviewImage | null
  graphData: GraphData | null

  // UI State
  isLoading: boolean
  isLoadingPreview: boolean
  error: string | null

  // Actions
  setInferences: (inferences: Inference[]) => void
  setCurrentInference: (inference: Inference | null) => void
  setPreviewImage: (image: PreviewImage | null) => void
  setGraphData: (data: GraphData | null) => void
  setLoading: (loading: boolean) => void
  setLoadingPreview: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  inferences: [],
  currentInference: null,
  previewImage: null,
  graphData: null,
  isLoading: false,
  isLoadingPreview: false,
  error: null,
}

export const useInferenceStore = create<InferenceState>()(
  devtools(
    (set) => ({
      ...initialState,

      setInferences: (inferences) => set({ inferences }),
      setCurrentInference: (inference) =>
        set({ currentInference: inference }),
      setPreviewImage: (image) => set({ previewImage: image }),
      setGraphData: (data) => set({ graphData: data }),
      setLoading: (loading) => set({ isLoading: loading }),
      setLoadingPreview: (loading) => set({ isLoadingPreview: loading }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
    }),
    { name: 'inference-store' }
  )
)

// Selectors
export const selectInferences = (state: InferenceState) => state.inferences
export const selectCurrentInference = (state: InferenceState) =>
  state.currentInference
export const selectPreviewImage = (state: InferenceState) => state.previewImage
export const selectGraphData = (state: InferenceState) => state.graphData
export const selectIsLoading = (state: InferenceState) => state.isLoading
export const selectError = (state: InferenceState) => state.error
