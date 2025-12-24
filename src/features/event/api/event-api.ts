import { api } from '@shared/api/client'
import { API_CONFIG } from '@shared/config/api'
import type { EventFilter, EventResponse, EventStatistics } from '@shared/types'

const { endpoints } = API_CONFIG

export const eventApi = {
  // Get events with pagination and filter
  getAll: (filter: EventFilter) =>
    api.get<EventResponse>(endpoints.events, { params: filter }),

  // Get event statistics
  getStatistics: (filter?: Partial<EventFilter>) =>
    api.get<EventStatistics>(`${endpoints.events}/statistics`, {
      params: filter,
    }),

  // Export events
  export: (filter: EventFilter, format: 'csv' | 'xlsx') =>
    api.get<Blob>(`${endpoints.events}/export`, {
      params: { ...filter, format },
      responseType: 'blob',
    }),
}
