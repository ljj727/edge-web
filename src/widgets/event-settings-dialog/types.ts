import type { EventSetting, EventType } from '@shared/types'

// Tree node structure for UI
export interface EventTreeNode {
  config: EventSetting
  children: EventTreeNode[]
}

// Build tree from flat configs array
export function buildTree(configs: EventSetting[]): EventTreeNode[] {
  const map = new Map<string, EventTreeNode>()
  const roots: EventTreeNode[] = []

  // First pass: create all nodes
  configs.forEach((config) => {
    map.set(config.eventSettingId, { config, children: [] })
  })

  // Second pass: connect parent-child
  configs.forEach((config) => {
    const node = map.get(config.eventSettingId)!
    if (config.parentId && map.has(config.parentId)) {
      map.get(config.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

// Flatten tree back to configs array
export function flattenTree(roots: EventTreeNode[]): EventSetting[] {
  const result: EventSetting[] = []

  function traverse(node: EventTreeNode) {
    result.push(node.config)
    node.children.forEach(traverse)
  }

  roots.forEach(traverse)
  return result
}

// Generate unique ID
export function generateEventId(): string {
  return `ev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Event type display info
export const EVENT_TYPE_INFO: Record<EventType, { label: string; color: string; icon: string }> = {
  ROI: { label: 'ROI Zone', color: '#22c55e', icon: '🔲' },
  Line: { label: 'Line', color: '#3b82f6', icon: '📏' },
  And: { label: 'AND', color: '#a855f7', icon: '⊓' },
  Or: { label: 'OR', color: '#f97316', icon: '⊔' },
  Speed: { label: 'Speed', color: '#eab308', icon: '⚡' },
  HM: { label: 'Heatmap', color: '#ec4899', icon: '🔥' },
  Filter: { label: 'Filter', color: '#6366f1', icon: '🔍' },
  EnEx: { label: 'Enter/Exit', color: '#14b8a6', icon: '🚪' },
  Alarm: { label: 'Alarm', color: '#ef4444', icon: '🔔' },
}

// Detection point options
export const DETECTION_POINTS = [
  { value: 'leftTop', label: 'Top Left' },
  { value: 'centerTop', label: 'Top Center' },
  { value: 'rightTop', label: 'Top Right' },
  { value: 'leftCenter', label: 'Center Left' },
  { value: 'center', label: 'Center' },
  { value: 'rightCenter', label: 'Center Right' },
  { value: 'leftBottom', label: 'Bottom Left' },
  { value: 'centerBottom', label: 'Bottom Center' },
  { value: 'rightBottom', label: 'Bottom Right' },
  { value: 'ALL', label: 'All Points' },
] as const

// Direction options
export const DIRECTION_OPTIONS = [
  { value: 'A2B', label: 'A → B' },
  { value: 'B2A', label: 'B → A' },
  { value: 'BOTH', label: 'Both' },
] as const

// Default settings for each event type
export function getDefaultEventSetting(eventType: EventType, name?: string): EventSetting {
  const id = generateEventId()
  const base: EventSetting = {
    eventType,
    eventSettingId: id,
    eventSettingName: name || `${EVENT_TYPE_INFO[eventType].label} ${id.slice(-4)}`,
  }

  switch (eventType) {
    case 'ROI':
      return {
        ...base,
        points: [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8]],
        target: { labels: [] },
        detectionPoint: 'centerBottom',
      }
    case 'Line':
      return {
        ...base,
        points: [[0.3, 0.5], [0.7, 0.5]],
        direction: 'BOTH',
        target: { labels: [] },
        detectionPoint: 'centerBottom',
      }
    case 'And':
      return {
        ...base,
        inOrder: false,
        ncond: '>=2',
      }
    case 'Or':
      return {
        ...base,
        ncond: '>=1',
      }
    case 'Speed':
      return base
    case 'HM':
      return {
        ...base,
        regenInterval: 60,
      }
    case 'Filter':
      return {
        ...base,
        points: [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]],
      }
    case 'EnEx':
      return {
        ...base,
        target: { labels: [] },
      }
    case 'Alarm':
      return {
        ...base,
        ext: '',
      }
    default:
      return base
  }
}

// Check if event type requires geometry (points)
export function requiresGeometry(eventType: EventType): boolean {
  return ['ROI', 'Line', 'Filter'].includes(eventType)
}

// Check if event type is a container (can have children)
export function isContainerType(eventType: EventType): boolean {
  return ['And', 'Or', 'Speed'].includes(eventType)
}
