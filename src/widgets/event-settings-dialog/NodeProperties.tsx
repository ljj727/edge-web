import { Button } from '@shared/ui'
import { Trash2, Plus, X } from 'lucide-react'
import type { Node } from '@xyflow/react'
import type { FlowNodeData, AlarmSensorConfig } from './CustomNodes'
import type { AppOutput } from '@widgets/vision-app-panel'
import { useSensorTypes, useSensors } from '@features/sensor'

interface NodePropertiesProps {
  node: Node | null
  onUpdate: (nodeId: string, data: Partial<FlowNodeData>) => void
  onDelete: (nodeId: string) => void
  appOutputs?: AppOutput[]
}

// LED colors for LA6_POE
const LED_COLORS = ['RED', 'YELLOW', 'GREEN', 'BLUE', 'WHITE']

// Alarm type options by sensor type
const ALARM_TYPES_BY_SENSOR: Record<string, { type: string; label: string }[]> = {
  LA6_POE: [{ type: 'LED', label: 'LED' }],
  AEPEL_IPSpeaker: [{ type: 'SPEAKER', label: 'Speaker' }],
  Adam6050: [{ type: 'DO', label: 'Digital Output' }],
  IoLogik_E1211: [{ type: 'DO', label: 'Digital Output' }],
}

export function NodeProperties({ node, onUpdate, onDelete, appOutputs = [] }: NodePropertiesProps) {
  // Debug: log appOutputs
  console.log('[NodeProperties] appOutputs:', appOutputs)

  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
        <p className="text-sm">Select a node to view properties</p>
        <p className="text-xs mt-1">or drag from toolbox to add</p>
      </div>
    )
  }

  const data = node.data as FlowNodeData

  const handleUpdate = (updates: Partial<FlowNodeData>) => {
    onUpdate(node.id, updates)
  }

  const toggleClass = (cls: string) => {
    const currentClasses = data.classes || []
    if (currentClasses.includes(cls)) {
      handleUpdate({ classes: currentClasses.filter((c) => c !== cls) })
    } else {
      handleUpdate({ classes: [...currentClasses, cls] })
    }
  }

  const toggleClassifier = (classifier: string) => {
    const currentClassifiers = data.classifiers || []
    if (currentClassifiers.includes(classifier)) {
      handleUpdate({ classifiers: currentClassifiers.filter((c) => c !== classifier) })
    } else {
      handleUpdate({ classifiers: [...currentClassifiers, classifier] })
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Properties</div>
          <div className="text-xs text-muted-foreground capitalize">{data.nodeType}</div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-destructive"
          onClick={() => onDelete(node.id)}
          title="Delete node"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {/* Name */}
        <Section title="Name">
          <input
            type="text"
            value={data.label}
            onChange={(e) => handleUpdate({ label: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border rounded bg-background"
          />
        </Section>

        {/* Object: Class Selection from App Outputs */}
        {data.nodeType === 'object' && (
          <>
            <Section title="Object">
              <div className="flex flex-wrap gap-1.5">
                {appOutputs.length > 0 ? (
                  appOutputs.map((output) => {
                    const isSelected = data.classes?.includes(output.label)
                    return (
                      <button
                        key={output.label}
                        onClick={() => toggleClass(output.label)}
                        className={`px-3 py-1.5 text-sm rounded transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {output.label}
                      </button>
                    )
                  })
                ) : (
                  <span className="text-xs text-muted-foreground">No outputs available</span>
                )}
              </div>
            </Section>

            {/* Show classifiers for selected classes */}
            {appOutputs
              .filter((output) => data.classes?.includes(output.label) && output.classifiers.length > 0)
              .map((output) => (
                <Section key={output.label} title="Classifier">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => {
                        // Clear all classifiers for this output when "None" is selected
                        const toRemove = output.classifiers.filter((c) => data.classifiers?.includes(c))
                        if (toRemove.length > 0) {
                          handleUpdate({
                            classifiers: (data.classifiers || []).filter((c) => !toRemove.includes(c))
                          })
                        }
                      }}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        !output.classifiers.some((c) => data.classifiers?.includes(c))
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      None
                    </button>
                    {output.classifiers.map((classifier) => {
                      const isSelected = data.classifiers?.includes(classifier)
                      return (
                        <button
                          key={classifier}
                          onClick={() => toggleClassifier(classifier)}
                          className={`px-3 py-1.5 text-sm rounded transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {classifier}
                        </button>
                      )
                    })}
                  </div>
                </Section>
              ))}
          </>
        )}

        {/* Zone: Points info */}
        {data.nodeType === 'zone' && (
          <>
            <Section title="Zone Area">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => handleUpdate({
                  points: [[0, 0], [1, 0], [1, 1], [0, 1]] as [number, number][]
                })}
              >
                Set Full Frame
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Cover entire video area
              </p>
            </Section>
            <Section title="Zone Points">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {data.points?.length || 0} points
                </p>
                <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-2 rounded">
                  <p>• <strong>Drag</strong> points to move</p>
                  <p>• <strong>Double-click</strong> edge to add point</p>
                  <p>• <strong>Right-click</strong> point to remove</p>
                  <p className="text-[10px] opacity-70">(minimum 3 points)</p>
                </div>
              </div>
            </Section>
          </>
        )}

        {/* Line: Crossing Direction */}
        {data.nodeType === 'line' && (
          <>
            <Section title="Crossing Direction">
              <select
                value={data.direction || 'BOTH'}
                onChange={(e) => handleUpdate({ direction: e.target.value as FlowNodeData['direction'] })}
                className="w-full px-2 py-1.5 text-sm border rounded bg-background"
              >
                <option value="A2B">A side → B side</option>
                <option value="B2A">B side → A side</option>
                <option value="BOTH">Both directions</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Perpendicular crossing direction
              </p>
            </Section>
            <Section title="Line Points">
              <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-2 rounded">
                <p>• <strong>Drag</strong> A or B to move</p>
                <p>• Line has 2 fixed points (A, B)</p>
              </div>
            </Section>
          </>
        )}

        {/* Count: Condition */}
        {data.nodeType === 'count' && (
          <Section title="Condition">
            <div className="flex items-center gap-2">
              <span className="text-sm">n</span>
              <input
                type="text"
                value={data.ncond || ''}
                onChange={(e) => handleUpdate({ ncond: e.target.value })}
                placeholder=">=1"
                className="flex-1 px-2 py-1.5 text-sm border rounded bg-background"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              e.g. &gt;=1, ==3, &lt;5
            </p>
          </Section>
        )}

        {/* Timeout: Duration */}
        {data.nodeType === 'timeout' && (
          <Section title="Duration">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={data.timeout || ''}
                onChange={(e) => handleUpdate({ timeout: Number(e.target.value) })}
                placeholder="5"
                className="flex-1 px-2 py-1.5 text-sm border rounded bg-background"
              />
              <span className="text-sm text-muted-foreground">seconds</span>
            </div>
          </Section>
        )}

        {/* Alarm: Sensor Settings */}
        {data.nodeType === 'alarm' && (
          <AlarmSensorSettings
            sensors={data.alarmSensors || []}
            onUpdate={(sensors) => {
              // Sync ext field with alarmSensors for API
              const ext = JSON.stringify(sensors.map(s => ({
                id: s.id,
                typeId: s.typeId,
                alarmType: s.alarmType,
                alarmValue: s.alarmValue,
                duration: s.duration,
                priority: s.priority || 0,
              })))
              handleUpdate({ alarmSensors: sensors, ext })
            }}
          />
        )}

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{title}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

// Alarm Sensor Settings Component
interface AlarmSensorSettingsProps {
  sensors: AlarmSensorConfig[]
  onUpdate: (sensors: AlarmSensorConfig[]) => void
}

function AlarmSensorSettings({ sensors, onUpdate }: AlarmSensorSettingsProps) {
  const { data: sensorTypes } = useSensorTypes()
  const { data: allSensors } = useSensors()

  const addSensorConfig = () => {
    const defaultTypeId = sensorTypes?.[0]?.id || ''
    const defaultTypeName = sensorTypes?.[0]?.name || ''
    const alarmTypes = ALARM_TYPES_BY_SENSOR[defaultTypeName] || []

    onUpdate([
      ...sensors,
      {
        id: '',
        typeId: defaultTypeId,
        alarmType: alarmTypes[0]?.type || 'LED',
        alarmValue: 'RED',
        duration: 5,
      },
    ])
  }

  const removeSensorConfig = (index: number) => {
    onUpdate(sensors.filter((_, i) => i !== index))
  }

  const updateSensorConfig = (index: number, updates: Partial<AlarmSensorConfig>) => {
    onUpdate(
      sensors.map((s, i) => (i === index ? { ...s, ...updates } : s))
    )
  }

  // Get sensors filtered by type
  const getSensorsByType = (typeId: string) => {
    return allSensors?.filter((s) => s.typeId === typeId) || []
  }

  // Get type name by ID
  const getTypeName = (typeId: string) => {
    return sensorTypes?.find((t) => t.id === typeId)?.name || ''
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">Sensors</label>
        <Button size="sm" variant="outline" className="h-7" onClick={addSensorConfig}>
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      {sensors.length === 0 && (
        <p className="text-xs text-muted-foreground">No sensors configured</p>
      )}

      {sensors.map((config, index) => {
        const typeName = getTypeName(config.typeId)
        const availableSensors = getSensorsByType(config.typeId)
        const _alarmTypes = ALARM_TYPES_BY_SENSOR[typeName] || []
        void _alarmTypes // Reserved for future use

        return (
          <div key={index} className="border rounded p-3 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Sensor #{index + 1}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-destructive"
                onClick={() => removeSensorConfig(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Type Selection */}
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <select
                value={config.typeId}
                onChange={(e) => {
                  const newTypeId = e.target.value
                  const newTypeName = getTypeName(newTypeId)
                  const newAlarmTypes = ALARM_TYPES_BY_SENSOR[newTypeName] || []
                  updateSensorConfig(index, {
                    typeId: newTypeId,
                    id: '', // Reset sensor selection
                    alarmType: newAlarmTypes[0]?.type || 'LED',
                    alarmValue: newTypeName === 'LA6_POE' ? 'RED' : '1',
                  })
                }}
                className="w-full px-2 py-1.5 text-sm border rounded bg-background mt-1"
              >
                {sensorTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sensor Selection */}
            <div>
              <label className="text-xs text-muted-foreground">Sensor</label>
              <select
                value={config.id}
                onChange={(e) => updateSensorConfig(index, { id: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border rounded bg-background mt-1"
              >
                <option value="">Select sensor...</option>
                {availableSensors.map((sensor) => (
                  <option key={sensor.id} value={sensor.id}>
                    {sensor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Settings based on type */}
            <div>
              <label className="text-xs text-muted-foreground">Settings</label>

              {/* LED Colors for LA6_POE */}
              {typeName === 'LA6_POE' && (
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground">LED:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {LED_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateSensorConfig(index, { alarmValue: color })}
                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                          config.alarmValue === color
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Digital Output for Adam6050 / IoLogik */}
              {(typeName === 'Adam6050' || typeName === 'IoLogik_E1211') && (
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground">Output Port:</span>
                  <input
                    type="text"
                    value={config.alarmValue}
                    onChange={(e) => updateSensorConfig(index, { alarmValue: e.target.value })}
                    placeholder="1"
                    className="w-full px-2 py-1.5 text-sm border rounded bg-background mt-1"
                  />
                </div>
              )}

              {/* Duration */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Duration:</span>
                <input
                  type="number"
                  value={config.duration}
                  onChange={(e) => updateSensorConfig(index, { duration: Number(e.target.value) })}
                  min={1}
                  className="w-20 px-2 py-1 text-sm border rounded bg-background"
                />
                <span className="text-xs text-muted-foreground">sec</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
