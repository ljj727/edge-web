import { api } from '@shared/api/client'
import { API_CONFIG } from '@shared/config/api'
import type { DxMetrics } from '@shared/types'

const { endpoints } = API_CONFIG

export const metricsApi = {
  // Get current metrics
  getCurrent: () => api.get<DxMetrics>(endpoints.metrics),

  // Get metrics history
  getHistory: (startTime?: number, endTime?: number) =>
    api.get<DxMetrics[]>(endpoints.metrics, {
      params: { startTime, endTime },
    }),
}
