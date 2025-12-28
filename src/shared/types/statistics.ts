// Statistics API Types

// Event Log
export interface EventLogItem {
  id: string
  camera_id: string
  camera_name: string
  event_type: string
  timestamp: string  // ISO 8601
  video_url?: string
  thumbnail_url?: string
}

export interface EventLogResponse {
  items: EventLogItem[]
  total: number
  page: number
  page_size: number
}

export interface EventLogRequest {
  camera_id?: string
  event_type?: string
  from?: string  // YYYY-MM-DD
  to?: string    // YYYY-MM-DD
  page?: number
  page_size?: number
}

// Summary
export interface SummaryItem {
  camera_id: string
  camera_name: string
  event_type: string
  start_date: string
  end_date: string
  count: number
}

export interface SummaryResponse {
  items: SummaryItem[]
}

export type StatisticsUnit = 'day' | 'month' | 'quarter' | 'year'

export interface SummaryRequest {
  camera_id?: string
  event_type?: string
  unit: StatisticsUnit
  date: string  // YYYY-MM-DD or YYYY-MM or YYYY-QN or YYYY
}

// Trend
export interface TrendSeries {
  event_type: string
  data: number[]
}

export interface TrendResponse {
  unit: StatisticsUnit
  date: string
  labels: string[]
  series: TrendSeries[]
}

export interface TrendRequest {
  camera_id?: string
  event_type?: string
  unit: StatisticsUnit
  date: string
}

// Event Types
export interface EventTypesResponse {
  event_types: string[]
}
