import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Event, EventFilter, EventPagination, EventStatistics } from '@shared/types'

interface EventState {
  // Data
  events: Event[]
  pagination: EventPagination | null
  statistics: EventStatistics | null
  filter: EventFilter

  // UI State
  isLoading: boolean
  error: string | null

  // Actions
  setEvents: (events: Event[]) => void
  setPagination: (pagination: EventPagination) => void
  setStatistics: (statistics: EventStatistics) => void
  setFilter: (filter: Partial<EventFilter>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetFilter: () => void
  reset: () => void
}

const defaultFilter: EventFilter = {
  page: 1,
  pageSize: 20,
}

const initialState = {
  events: [],
  pagination: null,
  statistics: null,
  filter: defaultFilter,
  isLoading: false,
  error: null,
}

export const useEventStore = create<EventState>()(
  devtools(
    (set) => ({
      ...initialState,

      setEvents: (events) => set({ events }),
      setPagination: (pagination) => set({ pagination }),
      setStatistics: (statistics) => set({ statistics }),
      setFilter: (filter) =>
        set((state) => ({ filter: { ...state.filter, ...filter } })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      resetFilter: () => set({ filter: defaultFilter }),
      reset: () => set(initialState),
    }),
    { name: 'event-store' }
  )
)
