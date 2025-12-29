import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Camera } from '@shared/types'

// Display settings for detection overlay
export interface CameraDisplaySettings {
  showBoundingBox: boolean
  showLabel: boolean
  showTrackId: boolean
  showScore: boolean
}

export const defaultDisplaySettings: CameraDisplaySettings = {
  showBoundingBox: true,
  showLabel: true,
  showTrackId: false,
  showScore: false,
}

interface CameraState {
  // Data
  cameras: Camera[]
  selectedCameraIds: string[]
  displaySettings: Record<string, CameraDisplaySettings> // per camera

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
  getDisplaySettings: (cameraId: string) => CameraDisplaySettings
  setDisplaySettings: (cameraId: string, settings: Partial<CameraDisplaySettings>) => void
  reset: () => void
}

const initialState = {
  cameras: [] as Camera[],
  selectedCameraIds: [] as string[],
  displaySettings: {} as Record<string, CameraDisplaySettings>,
  isLoading: false,
  error: null as string | null,
  isFormOpen: false,
}

export const useCameraStore = create<CameraState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setCameras: (cameras) => set({ cameras }),

        addCamera: (camera) =>
          set((state) => ({
            cameras: [...state.cameras, camera],
            selectedCameraIds: [...state.selectedCameraIds, camera.id].slice(0, 4),
          })),

        removeCamera: (id) =>
          set((state) => {
            const { [id]: _, ...restSettings } = state.displaySettings
            return {
              cameras: state.cameras.filter((c) => c.id !== id),
              selectedCameraIds: state.selectedCameraIds.filter((cid) => cid !== id),
              displaySettings: restSettings,
            }
          }),

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

        getDisplaySettings: (cameraId) => {
          const state = get()
          return state.displaySettings[cameraId] || defaultDisplaySettings
        },

        setDisplaySettings: (cameraId, settings) =>
          set((state) => ({
            displaySettings: {
              ...state.displaySettings,
              [cameraId]: {
                ...(state.displaySettings[cameraId] || defaultDisplaySettings),
                ...settings,
              },
            },
          })),

        reset: () => set(initialState),
      }),
      {
        name: 'camera-store',
        partialize: (state) => ({
          selectedCameraIds: state.selectedCameraIds,
          displaySettings: state.displaySettings,
        }),
      }
    ),
    { name: 'camera-store' }
  )
)
