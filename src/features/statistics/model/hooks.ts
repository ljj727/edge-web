import { useQuery } from '@tanstack/react-query'
import { statisticsApi } from '../api/statistics-api'
import type {
  EventLogRequest,
  SummaryRequest,
  TrendRequest,
} from '@shared/types'

const QUERY_KEYS = {
  events: (params: EventLogRequest) => ['statistics', 'events', params] as const,
  summary: (params: SummaryRequest) => ['statistics', 'summary', params] as const,
  trend: (params: TrendRequest) => ['statistics', 'trend', params] as const,
  eventTypes: ['statistics', 'event-types'] as const,
}

export function useEventLog(params: EventLogRequest) {
  return useQuery({
    queryKey: QUERY_KEYS.events(params),
    queryFn: () => statisticsApi.getEvents(params),
    staleTime: 30000,
  })
}

export function useSummary(params: SummaryRequest) {
  return useQuery({
    queryKey: QUERY_KEYS.summary(params),
    queryFn: () => statisticsApi.getSummary(params),
    staleTime: 60000,
  })
}

export function useTrend(params: TrendRequest) {
  return useQuery({
    queryKey: QUERY_KEYS.trend(params),
    queryFn: () => statisticsApi.getTrend(params),
    staleTime: 60000,
  })
}

export function useEventTypes() {
  return useQuery({
    queryKey: QUERY_KEYS.eventTypes,
    queryFn: statisticsApi.getEventTypes,
    staleTime: 300000, // 5 minutes
  })
}
