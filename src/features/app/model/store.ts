import { create } from 'zustand'
import type { App } from '@shared/types'

interface AppState {
  apps: App[]
  isUploadDialogOpen: boolean
  uploadProgress: number

  // Actions
  setApps: (apps: App[]) => void
  addApp: (app: App) => void
  removeApp: (id: string) => void
  setUploadDialogOpen: (open: boolean) => void
  setUploadProgress: (progress: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  apps: [],
  isUploadDialogOpen: false,
  uploadProgress: 0,

  setApps: (apps) => set({ apps }),

  addApp: (app) =>
    set((state) => ({ apps: [...state.apps, app] })),

  removeApp: (id) =>
    set((state) => ({ apps: state.apps.filter((a) => a.id !== id) })),

  setUploadDialogOpen: (open) => set({ isUploadDialogOpen: open, uploadProgress: 0 }),

  setUploadProgress: (progress) => set({ uploadProgress: progress }),
}))
