import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { DxMetrics } from '@shared/types'

interface MetricsState {
  // Data
  metrics: DxMetrics | null
  metricsHistory: DxMetrics[]

  // UI State
  isLoading: boolean
  error: string | null
  pollingInterval: number

  // Actions
  setMetrics: (metrics: DxMetrics) => void
  addToHistory: (metrics: DxMetrics) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPollingInterval: (interval: number) => void
  clearHistory: () => void
  reset: () => void
}

const MAX_HISTORY = 60 // Keep last 60 data points (10 minutes at 10s intervals)

const initialState = {
  metrics: null,
  metricsHistory: [],
  isLoading: false,
  error: null,
  pollingInterval: 10000, // 10 seconds
}

export const useMetricsStore = create<MetricsState>()(
  devtools(
    (set) => ({
      ...initialState,

      setMetrics: (metrics) => set({ metrics }),
      addToHistory: (metrics) =>
        set((state) => ({
          metricsHistory: [...state.metricsHistory.slice(-MAX_HISTORY + 1), metrics],
        })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setPollingInterval: (interval) => set({ pollingInterval: interval }),
      clearHistory: () => set({ metricsHistory: [] }),
      reset: () => set(initialState),
    }),
    { name: 'metrics-store' }
  )
)
