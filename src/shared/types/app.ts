// Vision App types (AppDTO from backend)

export interface AppModel {
  id: string
  name: string
  version: string
  capacity: number
  precision: string
  desc: string | null
  path: string | null
  model_memory_usage: number | null
  model_performance: number | null
}

export interface AppOutput {
  label: string
  classifiers: string[]
}

export interface App {
  id: string
  name: string
  version: string
  desc: string | null
  framework: string
  compute_capability: string | null
  platform: string | null
  evgen_path: string | null
  models: AppModel[]
  outputs: AppOutput[]
  properties: Record<string, unknown>
  app_memory_usage: number | null
  app_max_fps: number | null
}

export interface AppDeleteResponse {
  status: string
  message: string
}
