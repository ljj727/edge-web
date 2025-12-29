import { api } from '@shared/api/client'
import { API_CONFIG } from '@shared/config/api'
import type { Sensor, SensorType, SensorCreate, SensorUpdate } from '@shared/types'

const { endpoints } = API_CONFIG

export const sensorApi = {
  // Sensor Types
  getTypes: () => api.get<SensorType[]>(`${endpoints.sensors}/types`),

  seedTypes: () => api.post<{ status: string; created: number }>(`${endpoints.sensors}/types/seed`),

  createType: (data: SensorType) => api.post<SensorType>(`${endpoints.sensors}/types`, data),

  deleteType: (typeId: string) => api.delete<{ status: string }>(`${endpoints.sensors}/types/${typeId}`),

  // Sensors
  getAll: (typeId?: string) => {
    const query = typeId ? `?typeId=${encodeURIComponent(typeId)}` : ''
    return api.get<Sensor[]>(`${endpoints.sensors}${query}`)
  },

  getById: (id: string) => api.get<Sensor>(`${endpoints.sensors}/${id}`),

  create: (data: SensorCreate) => api.post<Sensor>(`${endpoints.sensors}`, data),

  update: (id: string, data: SensorUpdate) => api.put<Sensor>(`${endpoints.sensors}/${id}`, data),

  delete: (id: string) => api.delete<{ status: string }>(`${endpoints.sensors}/${id}`),
}
