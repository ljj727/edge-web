import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Dx, DxStatus, License } from '@shared/types'

interface DxState {
  // Data
  dx: Dx | null
  status: DxStatus | null
  license: License | null

  // UI State
  isLoading: boolean
  error: string | null

  // Actions
  setDx: (dx: Dx) => void
  setStatus: (status: DxStatus) => void
  setLicense: (license: License) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  dx: null,
  status: null,
  license: null,
  isLoading: false,
  error: null,
}

export const useDxStore = create<DxState>()(
  devtools(
    (set) => ({
      ...initialState,

      setDx: (dx) => set({ dx }),
      setStatus: (status) => set({ status }),
      setLicense: (license) => set({ license }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
    }),
    { name: 'dx-store' }
  )
)
