import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Camera } from '@shared/types'

interface CameraState {
  // Data
  cameras: Camera[]
  selectedCameraIds: string[]

  // UI State
  isLoading: boolean
  error: string | null
  isFormOpen: boolean

  // Actions
  setCameras: (cameras: Camera[]) => void
  addCamera: (camera: Camera) => void
  removeCamera: (id: string) => void
  updateCamera: (id: string, camera: Partial<Camera>) => void
  setSelectedCameraIds: (ids: string[]) => void
  toggleCameraSelection: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFormOpen: (open: boolean) => void
  reset: () => void
}

const initialState = {
  cameras: [],
  selectedCameraIds: [],
  isLoading: false,
  error: null,
  isFormOpen: false,
}

export const useCameraStore = create<CameraState>()(
  devtools(
    (set) => ({
      ...initialState,

      setCameras: (cameras) => set({ cameras }),

      addCamera: (camera) =>
        set((state) => ({
          cameras: [...state.cameras, camera],
          selectedCameraIds: [...state.selectedCameraIds, camera.id].slice(0, 4),
        })),

      removeCamera: (id) =>
        set((state) => ({
          cameras: state.cameras.filter((c) => c.id !== id),
          selectedCameraIds: state.selectedCameraIds.filter((cid) => cid !== id),
        })),

      updateCamera: (id, updates) =>
        set((state) => ({
          cameras: state.cameras.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      setSelectedCameraIds: (ids) =>
        set({ selectedCameraIds: ids.slice(0, 4) }),

      toggleCameraSelection: (id) =>
        set((state) => {
          const isSelected = state.selectedCameraIds.includes(id)
          if (isSelected) {
            return {
              selectedCameraIds: state.selectedCameraIds.filter((cid) => cid !== id),
            }
          }
          if (state.selectedCameraIds.length >= 4) {
            return state
          }
          return {
            selectedCameraIds: [...state.selectedCameraIds, id],
          }
        }),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setFormOpen: (open) => set({ isFormOpen: open }),
      reset: () => set(initialState),
    }),
    { name: 'camera-store' }
  )
)
