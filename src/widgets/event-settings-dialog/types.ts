// Legacy types for backward compatibility

export interface EventRule {
  id: string
  name: string
  enabled: boolean
  eventType: string
  condition: {
    type: 'count' | 'duration' | 'area'
    operator: '>=' | '<=' | '==' | '>'
    value: number
  }
  actions: {
    notification: boolean
    recording: boolean
    email: boolean
    webhook: boolean
  }
  schedule: {
    always: boolean
    startTime?: string
    endTime?: string
    days?: string[]
  }
}
