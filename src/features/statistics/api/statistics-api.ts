import { api } from '@shared/api/client'
import { API_CONFIG } from '@shared/config/api'
import type {
  EventLogRequest,
  EventLogResponse,
  SummaryRequest,
  SummaryResponse,
  TrendRequest,
  TrendResponse,
  EventTypesResponse,
} from '@shared/types'

const { endpoints } = API_CONFIG

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
  return filtered.length > 0 ? `?${filtered.join('&')}` : ''
}

export const statisticsApi = {
  // Get event log with pagination
  getEvents: (params: EventLogRequest) => {
    const query = buildQueryString({
      camera_id: params.camera_id,
      event_type: params.event_type,
      from: params.from,
      to: params.to,
      page: params.page,
      page_size: params.page_size,
    })
    return api.get<EventLogResponse>(`${endpoints.statistics}/events${query}`)
  },

  // Get summary statistics
  getSummary: (params: SummaryRequest) => {
    const query = buildQueryString({
      camera_id: params.camera_id,
      event_type: params.event_type,
      unit: params.unit,
      date: params.date,
    })
    return api.get<SummaryResponse>(`${endpoints.statistics}/summary${query}`)
  },

  // Get trend data for charts
  getTrend: (params: TrendRequest) => {
    const query = buildQueryString({
      camera_id: params.camera_id,
      event_type: params.event_type,
      unit: params.unit,
      date: params.date,
    })
    return api.get<TrendResponse>(`${endpoints.statistics}/trend${query}`)
  },

  // Get available event types
  getEventTypes: () => {
    return api.get<EventTypesResponse>(`${endpoints.statistics}/event-types`)
  },
}
