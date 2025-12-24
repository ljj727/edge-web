import type { Inference } from './inference'

export interface StreamSettings {
  maskingRegion: number[][][]
  detectionPoint: 'c:b' | 'c:c'
  lineCrossPoint: string
}

export interface Stream {
  id: string
  uri: string
  name: string
  deviceId: string
  serverId: string
  type: 'rtsp' | 'file' | 'hls'
  settings: StreamSettings
  inference: Inference[]
}

export interface SubCategory extends Stream {
  parentId?: string
  children?: SubCategory[]
}

export interface VideoTreeNode {
  id: string
  name: string
  type: 'server' | 'device' | 'stream'
  children?: VideoTreeNode[]
  data?: Stream
}

export interface MxServer {
  id: string
  name: string
  address: string
  port: number
  status: 'online' | 'offline'
  devices: MxDevice[]
}

export interface MxDevice {
  id: string
  name: string
  serverId: string
  streams: Stream[]
}

export interface HlsConfig {
  uri: string
  appId: string
  videoId: string
  wsPort?: number
}
