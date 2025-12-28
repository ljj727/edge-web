export const API_CONFIG = {
  baseURL: '/api',
  timeout: 10000,
  endpoints: {
    // Inference
    inference: '/v2/inference',
    inferenceEventSetting: '/v2/inference/event-setting',
    inferencePreview: '/v2/inference/preview',
    inferenceStream: '/v2/inference/stream',
    inferenceStatus: '/v2/inference/status',

    // Stream
    stream: '/v2/stream',
    streamSettings: '/v2/stream/settings',

    // Analytics (Vision Apps)
    analytics: '/v2/analytics',
    appRegistry: '/v2/app-registry',

    // Device
    dx: '/v2/dx',
    mx: '/v2/mx',

    // Events
    events: '/v2/events',

    // Metrics
    metrics: '/v2/metrics',

    // License
    license: '/v2/license',

    // Sensor
    sensor: '/v2/sensor',

    // System
    system: '/v2/system',

    // Statistics
    statistics: '/v2/statistics',
  },
} as const

export type ApiEndpoint = keyof typeof API_CONFIG.endpoints
