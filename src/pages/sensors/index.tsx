import { Card, CardContent, Button, Input } from '@shared/ui'
import { Bell, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { useSensorTypes, useSensors, useCreateSensor, useUpdateSensor, useDeleteSensor, useSeedSensorTypes } from '@features/sensor'
import { useState } from 'react'
import type { Sensor, SensorCreate, SensorUpdate } from '@shared/types'

export function SensorsPage() {
  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null)

  const { data: sensorTypes, isLoading: typesLoading } = useSensorTypes()
  const { data: sensors, isLoading: sensorsLoading } = useSensors(selectedTypeId || undefined)
  const seedTypesMutation = useSeedSensorTypes()
  const deleteMutation = useDeleteSensor()

  const handleEdit = (sensor: Sensor) => {
    setEditingSensor(sensor)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingSensor(null)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this sensor?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSensor(null)
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Sensors</h1>
            <p className="text-sm text-muted-foreground">
              Manage alarm devices and sensors
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {sensorTypes?.length === 0 && (
            <Button variant="outline" onClick={() => seedTypesMutation.mutate()} disabled={seedTypesMutation.isPending}>
              {seedTypesMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Initialize Types
            </Button>
          )}
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Sensor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium">Type:</span>
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm bg-background"
              >
                <option value="">All Types</option>
                {sensorTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Sensors Table */}
      <Card>
        <CardContent className="p-0">
          {typesLoading || sensorsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">IP:Port</th>
                  <th className="text-left p-3 font-medium">Max Time</th>
                  <th className="text-left p-3 font-medium">Time Restriction</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sensors?.map((sensor) => {
                  const sensorType = sensorTypes?.find((t) => t.id === sensor.typeId)
                  return (
                    <tr key={sensor.id} className="border-t">
                      <td className="p-3 font-medium">{sensor.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {sensorType?.name || sensor.typeId}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {sensor.ip}:{sensor.port}
                      </td>
                      <td className="p-3">{sensor.maxTime}s</td>
                      <td className="p-3">
                        {sensor.isTimeRestricted ? (
                          <span className="text-orange-600">
                            {sensor.timeRestrictedStart}:00 - {sensor.timeRestrictedEnd}:00
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(sensor)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDelete(sensor.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {(!sensors || sensors.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No sensors found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <SensorModal
          sensor={editingSensor}
          sensorTypes={sensorTypes || []}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

// Sensor Add/Edit Modal
interface SensorModalProps {
  sensor: Sensor | null
  sensorTypes: { id: string; name: string; protocol: string }[]
  onClose: () => void
}

function SensorModal({ sensor, sensorTypes, onClose }: SensorModalProps) {
  const isEdit = !!sensor
  const createMutation = useCreateSensor()
  const updateMutation = useUpdateSensor()

  const [form, setForm] = useState<SensorCreate>({
    name: sensor?.name || '',
    typeId: sensor?.typeId || (sensorTypes[0]?.id || ''),
    ip: sensor?.ip || '',
    port: sensor?.port || 80,
    maxTime: sensor?.maxTime || 120,
    pauseTime: sensor?.pauseTime || 2,
    isTimeRestricted: sensor?.isTimeRestricted || false,
    timeRestrictedStart: sensor?.timeRestrictedStart || 0,
    timeRestrictedEnd: sensor?.timeRestrictedEnd || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      updateMutation.mutate(
        { id: sensor.id, data: form as SensorUpdate },
        { onSuccess: onClose }
      )
    } else {
      createMutation.mutate(form, { onSuccess: onClose })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{isEdit ? 'Edit Sensor' : 'Add Sensor'}</h3>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Warehouse LED Tower"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <select
              value={form.typeId}
              onChange={(e) => setForm((prev) => ({ ...prev, typeId: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm bg-background"
              required
            >
              {sensorTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.protocol}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">IP Address</label>
              <Input
                value={form.ip}
                onChange={(e) => setForm((prev) => ({ ...prev, ip: e.target.value }))}
                placeholder="192.168.1.100"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Port</label>
              <Input
                type="number"
                value={form.port}
                onChange={(e) => setForm((prev) => ({ ...prev, port: Number(e.target.value) }))}
                placeholder="80"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Time (sec)</label>
              <Input
                type="number"
                value={form.maxTime}
                onChange={(e) => setForm((prev) => ({ ...prev, maxTime: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pause Time (sec)</label>
              <Input
                type="number"
                value={form.pauseTime}
                onChange={(e) => setForm((prev) => ({ ...prev, pauseTime: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="time-restricted"
                checked={form.isTimeRestricted}
                onChange={(e) => setForm((prev) => ({ ...prev, isTimeRestricted: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="time-restricted" className="text-sm">
                Enable Time Restriction
              </label>
            </div>

            {form.isTimeRestricted && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Hour (0-23)</label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={form.timeRestrictedStart}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, timeRestrictedStart: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Hour (0-23)</label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={form.timeRestrictedEnd}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, timeRestrictedEnd: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? 'Save Changes' : 'Add Sensor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
