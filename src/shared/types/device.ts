export interface Dx {
  id: string
  dx_id: string
  name: string
  address: string
  version: string
  framework: string
  capacity: number
  activated: boolean
  natsPort: number
  launcherPort: number
  license_type: 'trial' | 'standard' | 'enterprise'
  license_key: string
  end_date: string
}

export interface DxMetrics {
  cpuPercent: number
  cpuCount: number
  memoryTotal: number
  memoryUsed: number
  memoryPercent: number
  diskTotal: number
  diskUsed: number
  diskPercent: number
  uptime: number
}

export interface DxStatus {
  id: string
  status: 'running' | 'stopped' | 'error'
  uptime: number
  lastError?: string
}

export interface License {
  id: string
  type: 'trial' | 'standard' | 'enterprise'
  key: string
  startDate: string
  endDate: string
  maxStreams: number
  maxInferences: number
  features: string[]
  isValid: boolean
}

export interface Sensor {
  id: string
  name: string
  type: 'input' | 'output'
  protocol: 'modbus' | 'gpio' | 'mqtt'
  address: string
  port: number
  status: 'connected' | 'disconnected'
  value?: number | boolean
}
