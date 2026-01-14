// PLC Settings (Grid 설정) - Deprecated, use PlcCameraSettings
export interface PlcSettings {
  id: string
  baseAddress: string
  wordCount: number
  createdAt: string
  updatedAt?: string
}

export interface PlcSettingsRequest {
  baseAddress: string
  wordCount: number
}

// PLC Camera Settings (카메라별 Grid 설정)
export interface PlcCameraSettings {
  camera_id: string
  base_address: string
  word_count: number
  created_at?: string
  updated_at?: string
}

export interface PlcCameraSettingsRequest {
  base_address: string
  word_count: number
}

// PLC Connection
export interface PlcConnection {
  id: string
  name: string
  ip: string
  port: number
  address?: string
  word_count?: number
  suppress_seconds?: number
  protocol: 'TCP' | 'UDP'
  timeout_ms: number
  retry_count: number
  enabled: boolean
  created_at: string
  updated_at?: string
}

export interface PlcConnectionCreate {
  name: string
  ip: string
  port?: number
  address?: string
  word_count?: number
  suppress_seconds?: number
  protocol?: 'TCP' | 'UDP'
  timeout_ms?: number
  retry_count?: number
  enabled?: boolean
}

export interface PlcConnectionUpdate {
  name?: string
  ip?: string
  port?: number
  address?: string
  word_count?: number
  suppress_seconds?: number
  protocol?: 'TCP' | 'UDP'
  timeout_ms?: number
  retry_count?: number
  enabled?: boolean
}

// PLC Address
export interface PlcAddress {
  id: string
  connection_id: string
  name: string
  data_block: string
  address: string
  description?: string
  created_at: string
}

export interface PlcAddressCreate {
  connection_id: string
  name: string
  data_block?: string
  address?: string
  description?: string
}

export interface PlcAddressUpdate {
  name?: string
  data_block?: string
  address?: string
  description?: string
}

// PLC Event Mapping (Legacy)
export interface PlcEventMapping {
  id: string
  address_id: string
  event_type: string
  values: number[]
  enabled: boolean
  created_at: string
}

export interface PlcEventMappingCreate {
  address_id: string
  event_type: string
  values: number[]
  enabled?: boolean
}

export interface PlcEventMappingUpdate {
  event_type?: string
  values?: number[]
  enabled?: boolean
}

// PLC Event Config (New API)
export interface PlcEventConfig {
  camera_id?: string
  event_type: string
  label: string
  address: string
  bit: number | null
  enabled: boolean
  created_at?: string
  updated_at?: string
}

export interface PlcEventConfigCreate {
  event_type: string
  label?: string
  address?: string
  bit?: number | null
  enabled?: boolean
}

export interface PlcEventConfigUpdate {
  label?: string
  address?: string
  bit?: number | null
  enabled?: boolean
}

// PLC Status
export interface PlcConnectionStatus {
  connection_id?: string
  connected: boolean
  enabled?: boolean
  ip?: string
  port?: number
  address?: string
  word_count?: number
  last_sent?: string
  last_recv_hex?: string
  last_communication?: string
  error?: string
}

// PLC Send
export interface PlcSendRequest {
  connection_id?: string
  data_block?: string
  address?: string
  values: number[]
}

export interface PlcSendResponse {
  success: boolean
  response_time_ms?: number
  error?: string
}

// PLC Test Connection Response
export interface PlcTestResponse {
  success: boolean
  response_time_ms?: number
  error?: string
}

// PLC Log
export interface PlcLog {
  id: string
  camera_id?: string
  connection_id?: string
  connection_name?: string
  event_type?: string
  data_block?: string
  address?: string
  values: number[]
  values_hex?: string
  success: boolean
  response_time_ms?: number
  error?: string
  timestamp: string
}

export interface PlcLogsResponse {
  logs: PlcLog[]
  total: number
}
