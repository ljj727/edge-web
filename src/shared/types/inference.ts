// Event types for inference pipeline
// Must match compositor expected types (case sensitive!)
export type EventType =
  | 'RoI'        // Region of Interest (zone)
  | 'Line'       // Line crossing
  | 'And'        // Logical AND
  | 'Or'         // Logical OR
  | 'Speed'      // Speed detection
  | 'Heatmap'    // Heatmap generation
  | 'Filter'     // Count/timeout filter
  | 'Enter-Exit' // Enter-exit tracking
  | 'Alarm'      // Alarm trigger

export type DirectionType = 'A2B' | 'B2A' | 'BOTH'

export type DetectionPointType =
  | 'leftTop' | 'centerTop' | 'rightTop'
  | 'leftCenter' | 'center' | 'rightCenter'
  | 'leftBottom' | 'centerBottom' | 'rightBottom'
  | 'ALL'

export interface EventTarget {
  labels: string[]
  classifiers?: Record<string, string[]>
}

export interface EventSetting {
  eventType: EventType
  eventSettingId: string
  eventSettingName: string
  parentId?: string

  // Geometry - normalized coordinates (0~1)
  points?: [number, number][]

  // Target
  target?: EventTarget

  // Timing
  timeout?: number
  regenInterval?: number // HM regeneration interval

  // Logic
  ncond?: string // ">=2", "==3", etc.
  direction?: DirectionType
  inOrder?: boolean // For And events
  turn?: number // For Speed (0 or 1)

  // Other
  detectionPoint?: DetectionPointType
  ext?: string // JSON metadata for Alarm
}

export interface InferenceSettings {
  version: string
  configs: EventSetting[]
}

// Event setting update response
export interface EventSettingUpdateResponse {
  inference: Inference
  nats_sent: boolean
  nats_success: boolean
  nats_message: string
  termEvList: string[] // Terminal event IDs for monitoring
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

// Preview is now binary JPEG - no JSON wrapper
// Use blob URL directly

// Stream response from POST /api/v2/inference/stream
export interface StreamResponse {
  location: string
  ts_start: number
  session_id: string
}

// Inference status from GET /api/v2/inference/status
// Backend returns: NG=0, READY=1, CONNECTING=2, CONNECTED=3
export type InferenceStatusCode = 0 | 1 | 2 | 3
export type InferenceStatusType = 'running' | 'stopped' | 'error'

export interface InferenceStatusResponse {
  appId: string
  videoId: string
  status: InferenceStatusCode // Backend returns int: 0=NG, 1=READY, 2=CONNECTING, 3=CONNECTED
  count: number
  eos: boolean
  err: boolean
}

// Helper to convert backend status code to frontend status type
export function getInferenceStatusType(response: InferenceStatusResponse): InferenceStatusType {
  if (response.err) return 'error'
  if (response.status === 3) return 'running' // CONNECTED
  return 'stopped' // NG, READY, CONNECTING
}

export interface InferenceStatus {
  appId: string
  videoId: string
  status: InferenceStatusType
  session_id?: string
  started_at?: string
  error?: string
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
