import type { Node } from '@xyflow/react'
import type { FlowNodeData, FlowNodeType } from './FlowEditor'
import type { Zone } from './ZoneEditor'

interface PropertiesPanelProps {
  selectedNode: Node<FlowNodeData> | null
  zones: Zone[]
  onUpdateNode: (nodeId: string, data: Partial<FlowNodeData>) => void
  onUpdateZone: (zoneId: string, updates: Partial<Zone>) => void
  selectedZone: Zone | null
}

export function PropertiesPanel({
  selectedNode,
  zones,
  onUpdateNode,
  onUpdateZone,
  selectedZone,
}: PropertiesPanelProps) {
  if (!selectedNode && !selectedZone) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select a node or zone to edit properties
      </div>
    )
  }

  // Zone properties
  if (selectedZone) {
    return (
      <div className="p-4 space-y-4">
        <div>
          <div className="text-sm font-medium">{selectedZone.name}</div>
          <div className="text-xs text-muted-foreground">zone</div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Name</label>
            <input
              type="text"
              value={selectedZone.name}
              onChange={(e) => onUpdateZone(selectedZone.id, { name: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Color</label>
            <input
              type="color"
              value={selectedZone.color}
              onChange={(e) => onUpdateZone(selectedZone.id, { color: e.target.value })}
              className="w-full mt-1 h-10 border rounded-md bg-background cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Points</label>
            <div className="mt-1 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              {selectedZone.points.length / 2} vertices
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Node properties
  if (selectedNode) {
    const { data } = selectedNode
    const updateProperty = (key: string, value: any) => {
      onUpdateNode(selectedNode.id, {
        properties: { ...data.properties, [key]: value },
      })
    }

    return (
      <div className="p-4 space-y-4">
        <div>
          <div className="text-sm font-medium">{data.label}</div>
          <div className="text-xs text-muted-foreground">{data.nodeType}</div>
        </div>

        <div className="space-y-3">
          {/* Label */}
          <div>
            <label className="text-xs text-muted-foreground">Label</label>
            <input
              type="text"
              value={data.label}
              onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            />
          </div>

          {/* Type-specific properties */}
          {renderPropertiesForType(data.nodeType, data.properties, updateProperty, zones)}
        </div>
      </div>
    )
  }

  return null
}

function renderPropertiesForType(
  nodeType: FlowNodeType,
  properties: Record<string, any>,
  updateProperty: (key: string, value: any) => void,
  zones: Zone[]
) {
  switch (nodeType) {
    case 'object':
      return (
        <>
          <div>
            <label className="text-xs text-muted-foreground">Object Type</label>
            <select
              value={properties.objectType || 'person'}
              onChange={(e) => updateProperty('objectType', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="person">Person</option>
              <option value="vehicle">Vehicle</option>
              <option value="face">Face</option>
              <option value="helmet">Helmet</option>
              <option value="vest">Safety Vest</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Min Confidence</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={properties.confidence || 0.5}
              onChange={(e) => updateProperty('confidence', parseFloat(e.target.value))}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            />
          </div>
        </>
      )

    case 'zone':
      return (
        <>
          <div>
            <label className="text-xs text-muted-foreground">Zone</label>
            <select
              value={properties.zoneId || ''}
              onChange={(e) => updateProperty('zoneId', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="">Select zone...</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Detection Point</label>
            <select
              value={properties.detectionPoint || 'center_bottom'}
              onChange={(e) => updateProperty('detectionPoint', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="center">Center</option>
              <option value="center_bottom">Center Bottom</option>
              <option value="center_top">Center Top</option>
              <option value="bbox">Bounding Box</option>
            </select>
          </div>
        </>
      )

    case 'timeout':
      return (
        <>
          <div>
            <label className="text-xs text-muted-foreground">Duration</label>
            <input
              type="number"
              min={0}
              value={properties.duration || 5}
              onChange={(e) => updateProperty('duration', parseInt(e.target.value))}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Unit</label>
            <select
              value={properties.unit || 'seconds'}
              onChange={(e) => updateProperty('unit', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
              <option value="frames">Frames</option>
            </select>
          </div>
        </>
      )

    case 'count':
      return (
        <>
          <div>
            <label className="text-xs text-muted-foreground">Operator</label>
            <select
              value={properties.operator || '>='}
              onChange={(e) => updateProperty('operator', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value=">=">≥ (greater or equal)</option>
              <option value="<=">≤ (less or equal)</option>
              <option value="==">= (equal)</option>
              <option value=">">{">"} (greater)</option>
              <option value="<">{"<"} (less)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Value</label>
            <input
              type="number"
              min={0}
              value={properties.value || 1}
              onChange={(e) => updateProperty('value', parseInt(e.target.value))}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            />
          </div>
        </>
      )

    case 'speed':
      return (
        <>
          <div>
            <label className="text-xs text-muted-foreground">Operator</label>
            <select
              value={properties.operator || '>='}
              onChange={(e) => updateProperty('operator', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value=">=">≥ (greater or equal)</option>
              <option value="<=">≤ (less or equal)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Speed</label>
            <input
              type="number"
              min={0}
              value={properties.value || 10}
              onChange={(e) => updateProperty('value', parseInt(e.target.value))}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Unit</label>
            <select
              value={properties.unit || 'km/h'}
              onChange={(e) => updateProperty('unit', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="km/h">km/h</option>
              <option value="m/s">m/s</option>
              <option value="mph">mph</option>
            </select>
          </div>
        </>
      )

    case 'merge':
      return (
        <div>
          <label className="text-xs text-muted-foreground">Logic</label>
          <select
            value={properties.logic || 'and'}
            onChange={(e) => updateProperty('logic', e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="and">AND (all conditions)</option>
            <option value="or">OR (any condition)</option>
          </select>
        </div>
      )

    case 'event':
      return (
        <>
          <div>
            <label className="text-xs text-muted-foreground">Event Name</label>
            <input
              type="text"
              value={properties.name || 'Event'}
              onChange={(e) => updateProperty('name', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Severity</label>
            <select
              value={properties.severity || 'warning'}
              onChange={(e) => updateProperty('severity', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </>
      )

    case 'alarm':
      return (
        <div>
          <label className="text-xs text-muted-foreground">Actions</label>
          <div className="space-y-2 mt-1">
            {['notification', 'email', 'webhook', 'recording'].map((action) => (
              <label key={action} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(properties.actions || []).includes(action)}
                  onChange={(e) => {
                    const actions = properties.actions || []
                    if (e.target.checked) {
                      updateProperty('actions', [...actions, action])
                    } else {
                      updateProperty('actions', actions.filter((a: string) => a !== action))
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm capitalize">{action}</span>
              </label>
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}
