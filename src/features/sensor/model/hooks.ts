import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sensorApi } from '../api/sensor-api'
import type { SensorCreate, SensorUpdate } from '@shared/types'

const QUERY_KEYS = {
  types: ['sensor-types'] as const,
  sensors: (typeId?: string) => ['sensors', typeId] as const,
  sensor: (id: string) => ['sensor', id] as const,
}

// Sensor Types
export function useSensorTypes() {
  return useQuery({
    queryKey: QUERY_KEYS.types,
    queryFn: sensorApi.getTypes,
    staleTime: 300000, // 5 minutes
  })
}

export function useSeedSensorTypes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sensorApi.seedTypes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.types })
    },
  })
}

// Sensors
export function useSensors(typeId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.sensors(typeId),
    queryFn: () => sensorApi.getAll(typeId),
  })
}

export function useSensor(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.sensor(id),
    queryFn: () => sensorApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateSensor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SensorCreate) => sensorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensors'] })
    },
  })
}

export function useUpdateSensor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SensorUpdate }) => sensorApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['sensors'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sensor(id) })
    },
  })
}

export function useDeleteSensor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sensorApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensors'] })
    },
  })
}
