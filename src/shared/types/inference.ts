// Event types for inference pipeline
export type EventType =
  | 'RoI'
  | 'Line'
  | 'Speed'
  | 'Alarm'
  | 'AND'
  | 'sensor_input'
  | 'Object'
  | 'Attribute'
  | 'Timeout'
  | 'Count'
  | 'Merge'

export interface EventSetting {
  eventType: EventType
  eventSettingId: string
  eventSettingName: string
  points?: number[][]
  target?: string[]
  direction?: 'in' | 'out' | 'both'
  timeout?: number
  ncond?: number
  turn?: string
  parentId?: string
  ext?: string // JSON metadata (for alarms)
}

export interface InferenceSettings {
  version: string
  configs: EventSetting[]
}

export interface Inference {
  appId: string
  videoId: string
  uri: string
  name: string
  type: string
  settings: InferenceSettings
  nodeSettings: string // JSON string of Rappid graph
}

export interface InferenceWithAnalytics extends Inference {
  analytics?: Analytics
}

export interface Analytics {
  id: string
  name: string
  type: string
  version: string
  description?: string
}

export interface PreviewImage {
  appId: string
  videoId: string
  imageData: string // base64
  timestamp: number
}

// Rappid graph node types
export enum ShapeType {
  BASE = 'app.Base',
  OBJECT = 'app.opObject',
  ATTRIBUTE = 'app.opAttribute',
  TIMEOUT = 'app.opTimeout',
  COUNT = 'app.opCount',
  SPEED = 'app.opSpeed',
  MERGE = 'app.opMerge',
  EVENT = 'app.opEvent',
  ZONE = 'app.opZone',
  DIRECTION = 'app.opDirection',
  SENSOR = 'app.opSensor',
  ALARM = 'app.opAlarm',
  LINK = 'app.Link',
}

export interface GraphNode {
  id: string
  type: ShapeType
  opType: string
  opInfo: Record<string, unknown>
  attrs: Record<string, unknown>
  position: { x: number; y: number }
  size: { width: number; height: number }
  ports?: Record<string, unknown>
  preId?: string
  nextId?: string
}

export interface GraphLink {
  id: string
  type: 'app.Link'
  source: { id: string; port: string }
  target: { id: string; port: string }
}

export type GraphCell = GraphNode | GraphLink

export interface GraphData {
  cells: GraphCell[]
}
