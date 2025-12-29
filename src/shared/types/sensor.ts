// Sensor types for alarm devices

export interface SensorType {
  id: string
  name: string
  protocol: string
}

export interface Sensor {
  id: string
  name: string
  typeId: string
  ip: string
  port: number
  maxTime: number
  pauseTime: number
  isTimeRestricted: boolean
  timeRestrictedStart: number
  timeRestrictedEnd: number
}

export interface SensorCreate {
  name: string
  typeId: string
  ip: string
  port: number
  maxTime?: number
  pauseTime?: number
  isTimeRestricted?: boolean
  timeRestrictedStart?: number
  timeRestrictedEnd?: number
}

export interface SensorUpdate {
  name?: string
  typeId?: string
  ip?: string
  port?: number
  maxTime?: number
  pauseTime?: number
  isTimeRestricted?: boolean
  timeRestrictedStart?: number
  timeRestrictedEnd?: number
}
