// Detection result from NATS inference.result.{stream_id}

export interface DetectionBBox {
  x: number  // 0~1 normalized
  y: number  // 0~1 normalized
  w: number  // 0~1 normalized
  h: number  // 0~1 normalized
}

export interface DetectionObject {
  id: number
  label: string
  score_d: number
  bbox: DetectionBBox
}

export interface DetectionMetadata {
  app_id: string
  stream_id: string
  timestamp: number
  resolution: {
    width: number
    height: number
  }
}

export interface DetectionResult {
  objects: DetectionObject[]
  metadata: DetectionMetadata
}
