export interface Event {
  id: string
  eventType: string
  eventName: string
  streamId: string
  streamName: string
  appId: string
  appName: string
  timestamp: string
  data: Record<string, unknown>
  imageUrl?: string
}

export interface EventFilter {
  startDate?: string
  endDate?: string
  eventTypes?: string[]
  streamIds?: string[]
  appIds?: string[]
  page?: number
  pageSize?: number
}

export interface EventPagination {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface EventResponse {
  data: Event[]
  pagination: EventPagination
}

export interface Alarm {
  id: string
  eventId: string
  name: string
  type: 'speaker' | 'moxa' | 'external'
  config: AlarmConfig
  enabled: boolean
}

export interface AlarmConfig {
  // Speaker config
  audioFile?: string
  volume?: number
  repeat?: number

  // Moxa config
  moxaAddress?: string
  moxaPort?: number
  outputChannel?: number

  // External API config
  apiUrl?: string
  apiMethod?: 'GET' | 'POST'
  apiHeaders?: Record<string, string>
  apiBody?: string
}

export interface EventStatistics {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsByStream: Record<string, number>
  eventsByHour: { hour: number; count: number }[]
  eventsByDay: { date: string; count: number }[]
}
