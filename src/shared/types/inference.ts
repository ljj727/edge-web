// Event types for inference pipeline
// Must match compositor expected types (case sensitive!)
export type EventType =
  | 'RoI'        // Region of Interest (zone) - v1 format
  | 'ROI'        // Region of Interest (zone) - v2 format
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

// v1 style target (multiple labels)
export interface EventTarget {
  labels: string[]
  classifiers?: Record<string, string[]>
}

// v2 style target (single label)
export interface EventTargetV2 {
  label: string
}

export interface EventSetting {
  eventType: EventType
  eventSettingId: string
  eventSettingName: string
  parentId?: string

  // Geometry - normalized coordinates (0~1)
  points?: [number, number][]

  // Target (v1 style - single target with multiple labels)
  target?: EventTarget | EventTargetV2

  // Targets (v2 style - multiple targets for ROI)
  targets?: EventTargetV2[]

  // Timing
  timeout?: number
  regenInterval?: number // HM regeneration interval

  // Logic
  ncond?: string // ">=2", "==3", etc.
  direction?: DirectionType
  inOrder?: boolean // For And events
  turn?: number // For Speed (0 or 1)

  // v2 Line properties
  keypoints?: number[]       // [1], [2,3] etc - keypoint indices to detect
  warningDistance?: number   // 0.0 ~ 1.0 normalized distance for WARNING zone

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
  nodeSettings: Record<string, unknown> | string | null // JSON object or string of flow graph
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
// Backend returns: STARTING=0, RUNNING=1, STOPPED=2, ERROR=3, RECONNECTING=4
export type InferenceStatusCode = 0 | 1 | 2 | 3 | 4
export type InferenceStatusType = 'starting' | 'running' | 'stopped' | 'error' | 'reconnecting'

export interface InferenceStatusResponse {
  appId: string
  videoId: string
  status: InferenceStatusCode // Backend: 0=STARTING, 1=RUNNING, 2=STOPPED, 3=ERROR, 4=RECONNECTING
  count: number
  eos: boolean
  err: boolean
}

// Helper to convert backend status code to frontend status type
export function getInferenceStatusType(response: InferenceStatusResponse): InferenceStatusType {
  if (response.err) return 'error'
  switch (response.status) {
    case 0: return 'starting'      // STARTING
    case 1: return 'running'       // RUNNING
    case 2: return 'stopped'       // STOPPED
    case 3: return 'error'         // ERROR
    case 4: return 'reconnecting'  // RECONNECTING
    default: return 'stopped'
  }
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
