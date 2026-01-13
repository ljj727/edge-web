import { useState } from 'react'
import {
  Cpu, Settings, Activity, FlaskConical, Plus, Trash2, Edit2, X,
  Check, AlertCircle, Wifi, WifiOff, Send, RefreshCw
} from 'lucide-react'
import { cn } from '@shared/lib/cn'

// =============================================================================
// Types
// =============================================================================

interface PlcConnection {
  id: string
  name: string
  ip: string
  port: number
  protocol: 'TCP' | 'UDP'
  timeout_ms: number
  retry_count: number
  enabled: boolean
}

interface PlcAddress {
  id: string
  connection_id: string
  name: string
  data_block: string
  address: string
  description: string
}

interface PlcEventMapping {
  id: string
  address_id: string
  event_type: string
  values: number[]
  enabled: boolean
}

interface PlcLog {
  id: string
  timestamp: Date
  connection_name: string
  event_type: string
  values: number[]
  success: boolean
  error?: string
  response_time_ms?: number
}

type TabType = 'settings' | 'monitor' | 'test'

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_CONNECTION: Omit<PlcConnection, 'id'> = {
  name: '',
  ip: '',
  port: 10260,
  protocol: 'TCP',
  timeout_ms: 1000,
  retry_count: 3,
  enabled: true,
}

const DEFAULT_ADDRESS: Omit<PlcAddress, 'id' | 'connection_id'> = {
  name: '',
  data_block: 'D0',
  address: '009400',
  description: '',
}

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_CONNECTIONS: PlcConnection[] = [
  {
    id: 'conn-1',
    name: '라인1 PLC',
    ip: '192.168.0.211',
    port: 10260,
    protocol: 'TCP',
    timeout_ms: 1000,
    retry_count: 3,
    enabled: true,
  },
  {
    id: 'conn-2',
    name: '라인2 PLC',
    ip: '192.168.0.212',
    port: 10260,
    protocol: 'TCP',
    timeout_ms: 1000,
    retry_count: 3,
    enabled: false,
  },
]

const MOCK_ADDRESSES: PlcAddress[] = [
  {
    id: 'addr-1',
    connection_id: 'conn-1',
    name: '작업 시작 신호',
    data_block: 'D0',
    address: '009400',
    description: '라인1 작업 트리거',
  },
  {
    id: 'addr-2',
    connection_id: 'conn-1',
    name: '작업 완료 신호',
    data_block: 'D0',
    address: '009402',
    description: '라인1 작업 완료',
  },
  {
    id: 'addr-3',
    connection_id: 'conn-1',
    name: '에러 신호',
    data_block: 'D0',
    address: '009404',
    description: '라인1 에러 발생',
  },
]

const MOCK_MAPPINGS: PlcEventMapping[] = [
  { id: 'map-1', address_id: 'addr-1', event_type: 'WORK_START', values: [1, 0, 0, 0], enabled: true },
  { id: 'map-2', address_id: 'addr-2', event_type: 'WORK_END', values: [0, 1, 0, 0], enabled: true },
  { id: 'map-3', address_id: 'addr-3', event_type: 'ERROR', values: [0, 0, 1, 0], enabled: true },
]

const MOCK_LOGS: PlcLog[] = [
  { id: 'log-1', timestamp: new Date(Date.now() - 5000), connection_name: '라인1 PLC', event_type: 'WORK_START', values: [1, 0, 0, 0], success: true, response_time_ms: 45 },
  { id: 'log-2', timestamp: new Date(Date.now() - 15000), connection_name: '라인1 PLC', event_type: 'WORK_END', values: [0, 1, 0, 0], success: true, response_time_ms: 38 },
  { id: 'log-3', timestamp: new Date(Date.now() - 60000), connection_name: '라인2 PLC', event_type: 'ERROR', values: [0, 0, 1, 0], success: false, error: '타임아웃' },
  { id: 'log-4', timestamp: new Date(Date.now() - 120000), connection_name: '라인1 PLC', event_type: 'WORK_START', values: [1, 0, 0, 0], success: true, response_time_ms: 52 },
]

const EVENT_TYPES = ['WORK_START', 'WORK_END', 'ERROR', 'WARNING', 'RESET']

// =============================================================================
// Main Component
// =============================================================================

export function PlcPage() {
  const [activeTab, setActiveTab] = useState<TabType>('settings')

  const tabs = [
    { id: 'settings' as const, icon: Settings, label: 'PLC 설정' },
    { id: 'monitor' as const, icon: Activity, label: 'PLC 확인' },
    { id: 'test' as const, icon: FlaskConical, label: 'PLC 테스트' },
  ]

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-56 border-r flex flex-col bg-muted/30">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            PLC
          </h2>
        </div>
        <div className="flex-1 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'settings' && <PlcSettingsTab />}
        {activeTab === 'monitor' && <PlcMonitorTab />}
        {activeTab === 'test' && <PlcTestTab />}
      </div>
    </div>
  )
}

// =============================================================================
// Settings Tab
// =============================================================================

function PlcSettingsTab() {
  const [connections, setConnections] = useState<PlcConnection[]>(MOCK_CONNECTIONS)
  const [addresses, setAddresses] = useState<PlcAddress[]>(MOCK_ADDRESSES)
  const [mappings, setMappings] = useState<PlcEventMapping[]>(MOCK_MAPPINGS)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(MOCK_CONNECTIONS[0]?.id || null)

  // Modal states
  const [connectionModal, setConnectionModal] = useState<{ open: boolean; data: PlcConnection | null }>({ open: false, data: null })
  const [addressModal, setAddressModal] = useState<{ open: boolean; data: (PlcAddress & { mapping?: PlcEventMapping }) | null }>({ open: false, data: null })

  const selectedConnection = connections.find(c => c.id === selectedConnectionId)
  const selectedAddresses = addresses.filter(a => a.connection_id === selectedConnectionId)

  const handleSaveConnection = (data: PlcConnection) => {
    if (connections.find(c => c.id === data.id)) {
      setConnections(prev => prev.map(c => c.id === data.id ? data : c))
    } else {
      setConnections(prev => [...prev, data])
    }
    setConnectionModal({ open: false, data: null })
  }

  const handleDeleteConnection = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id))
    setAddresses(prev => prev.filter(a => a.connection_id !== id))
    if (selectedConnectionId === id) {
      setSelectedConnectionId(connections.find(c => c.id !== id)?.id || null)
    }
  }

  const handleSaveAddress = (address: PlcAddress, mapping?: PlcEventMapping) => {
    if (addresses.find(a => a.id === address.id)) {
      setAddresses(prev => prev.map(a => a.id === address.id ? address : a))
    } else {
      setAddresses(prev => [...prev, address])
    }
    if (mapping) {
      if (mappings.find(m => m.id === mapping.id)) {
        setMappings(prev => prev.map(m => m.id === mapping.id ? mapping : m))
      } else {
        setMappings(prev => [...prev, mapping])
      }
    }
    setAddressModal({ open: false, data: null })
  }

  const handleDeleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id))
    setMappings(prev => prev.filter(m => m.address_id !== id))
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <h2 className="text-xl font-semibold">PLC 설정</h2>
        <p className="text-sm text-muted-foreground">연결, 주소, 이벤트 매핑 관리</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Connections Section */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">PLC 연결</h3>
            <button
              onClick={() => setConnectionModal({ open: true, data: null })}
              className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              추가
            </button>
          </div>
          <div className="p-4">
            {connections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">연결 없음</p>
            ) : (
              <div className="space-y-2">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    onClick={() => setSelectedConnectionId(conn.id)}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedConnectionId === conn.id
                        ? 'bg-primary/5 border-primary/30'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        conn.enabled ? 'bg-green-500' : 'bg-gray-400'
                      )} />
                      <div>
                        <p className="font-medium text-sm">{conn.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {conn.ip}:{conn.port} ({conn.protocol})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setConnectionModal({ open: true, data: conn }) }}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteConnection(conn.id) }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Addresses Section */}
        {selectedConnection && (
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold">{selectedConnection.name} - 주소 매핑</h3>
              <button
                onClick={() => setAddressModal({ open: true, data: null })}
                className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                추가
              </button>
            </div>
            <div className="p-4">
              {selectedAddresses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">주소 매핑 없음</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">이름</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">주소</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">이벤트</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">값</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAddresses.map((addr) => {
                        const mapping = mappings.find(m => m.address_id === addr.id)
                        return (
                          <tr key={addr.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-2 px-3 font-medium">{addr.name}</td>
                            <td className="py-2 px-3 font-mono text-muted-foreground">
                              {addr.data_block}:{addr.address}
                            </td>
                            <td className="py-2 px-3">
                              {mapping ? (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs font-medium">
                                  {mapping.event_type}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs">
                              {mapping ? `[${mapping.values.join(', ')}]` : '-'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setAddressModal({ open: true, data: { ...addr, mapping } })}
                                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Connection Modal */}
      {connectionModal.open && (
        <ConnectionModal
          data={connectionModal.data}
          onSave={handleSaveConnection}
          onClose={() => setConnectionModal({ open: false, data: null })}
        />
      )}

      {/* Address Modal */}
      {addressModal.open && selectedConnectionId && (
        <AddressModal
          connectionId={selectedConnectionId}
          data={addressModal.data}
          onSave={handleSaveAddress}
          onClose={() => setAddressModal({ open: false, data: null })}
        />
      )}
    </div>
  )
}

// =============================================================================
// Monitor Tab
// =============================================================================

function PlcMonitorTab() {
  const [connections] = useState<PlcConnection[]>(MOCK_CONNECTIONS)
  const [logs] = useState<PlcLog[]>(MOCK_LOGS)

  // Mock connection status
  const connectionStatus: Record<string, { connected: boolean; lastComm: Date }> = {
    'conn-1': { connected: true, lastComm: new Date(Date.now() - 2000) },
    'conn-2': { connected: false, lastComm: new Date(Date.now() - 300000) },
  }

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime()
    if (diff < 60000) return `${Math.floor(diff / 1000)}초 전`
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
    return date.toLocaleTimeString()
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <h2 className="text-xl font-semibold">PLC 확인</h2>
        <p className="text-sm text-muted-foreground">연결 상태 및 전송 로그</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Connection Status */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold">연결 상태</h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {connections.map((conn) => {
                const status = connectionStatus[conn.id]
                return (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {status?.connected ? (
                        <Wifi className="h-5 w-5 text-green-500" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{conn.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {conn.ip}:{conn.port}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        status?.connected
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      )}>
                        {status?.connected ? '연결됨' : '연결 끊김'}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        마지막 통신: {status ? formatTime(status.lastComm) : '-'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">전송 로그</h3>
            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">로그 없음</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      log.success ? 'bg-green-50/50' : 'bg-red-50/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {log.success ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{log.connection_name}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs font-medium">
                            {log.event_type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          [{log.values.join(', ')}]
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </p>
                      {log.success ? (
                        <p className="text-xs text-green-600">{log.response_time_ms}ms</p>
                      ) : (
                        <p className="text-xs text-red-600">{log.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Test Tab
// =============================================================================

function PlcTestTab() {
  const [connections] = useState<PlcConnection[]>(MOCK_CONNECTIONS)
  const [addresses] = useState<PlcAddress[]>(MOCK_ADDRESSES)
  const [mappings] = useState<PlcEventMapping[]>(MOCK_MAPPINGS)

  // Test form state
  const [selectedConnectionId, setSelectedConnectionId] = useState(MOCK_CONNECTIONS[0]?.id || '')
  const [dataBlock, setDataBlock] = useState('D0')
  const [address, setAddress] = useState('009400')
  const [valuesStr, setValuesStr] = useState('1, 0, 0, 0')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; time?: number } | null>(null)
  const [sending, setSending] = useState(false)

  const handleSendTest = () => {
    setSending(true)
    setTestResult(null)
    // Simulate API call
    setTimeout(() => {
      const success = Math.random() > 0.3
      setTestResult({
        success,
        message: success ? '전송 성공' : '타임아웃',
        time: success ? Math.floor(Math.random() * 50) + 20 : undefined,
      })
      setSending(false)
    }, 1000)
  }

  const handleQuickTest = (connectionId: string, addressId: string) => {
    const conn = connections.find(c => c.id === connectionId)
    const addr = addresses.find(a => a.id === addressId)
    const mapping = mappings.find(m => m.address_id === addressId)
    if (!conn || !addr || !mapping) return

    setSelectedConnectionId(connectionId)
    setDataBlock(addr.data_block)
    setAddress(addr.address)
    setValuesStr(mapping.values.join(', '))
    handleSendTest()
  }

  // Group addresses by connection
  const addressesByConnection = connections.map(conn => ({
    connection: conn,
    addresses: addresses
      .filter(a => a.connection_id === conn.id)
      .map(addr => ({
        ...addr,
        mapping: mappings.find(m => m.address_id === addr.id),
      }))
      .filter(a => a.mapping),
  }))

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <h2 className="text-xl font-semibold">PLC 테스트</h2>
        <p className="text-sm text-muted-foreground">수동 전송 테스트</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Manual Test */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold">테스트 전송</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">연결</label>
                <select
                  value={selectedConnectionId}
                  onChange={(e) => setSelectedConnectionId(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {connections.map(conn => (
                    <option key={conn.id} value={conn.id}>{conn.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Data Block</label>
                <input
                  value={dataBlock}
                  onChange={(e) => setDataBlock(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="D0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="009400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">값 (U16[])</label>
                <input
                  value={valuesStr}
                  onChange={(e) => setValuesStr(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="1, 0, 0, 0"
                />
              </div>
            </div>
            <button
              onClick={handleSendTest}
              disabled={sending}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Send className={cn('h-4 w-4', sending && 'animate-pulse')} />
              {sending ? '전송 중...' : '전송'}
            </button>

            {testResult && (
              <div className={cn(
                'p-3 rounded-lg flex items-center gap-3',
                testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              )}>
                {testResult.success ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <div>
                  <p className="font-medium text-sm">{testResult.message}</p>
                  {testResult.time && (
                    <p className="text-xs opacity-75">응답시간: {testResult.time}ms</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Test */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold">빠른 테스트</h3>
          </div>
          <div className="p-4 space-y-4">
            {addressesByConnection.map(({ connection, addresses }) => (
              addresses.length > 0 && (
                <div key={connection.id}>
                  <p className="text-sm font-medium mb-2">{connection.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        onClick={() => handleQuickTest(connection.id, addr.id)}
                        className="px-3 py-1.5 bg-muted hover:bg-muted/80 border rounded-lg text-sm transition-colors"
                      >
                        {addr.name} ({addr.mapping?.event_type})
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Modals
// =============================================================================

interface ConnectionModalProps {
  data: PlcConnection | null
  onSave: (data: PlcConnection) => void
  onClose: () => void
}

function ConnectionModal({ data, onSave, onClose }: ConnectionModalProps) {
  const [form, setForm] = useState<PlcConnection>(
    data || { ...DEFAULT_CONNECTION, id: `conn-${Date.now()}` }
  )
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTest = () => {
    setTesting(true)
    setTestResult(null)
    setTimeout(() => {
      const success = Math.random() > 0.3
      setTestResult({ success, message: success ? '연결 성공' : '연결 실패' })
      setTesting(false)
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">{data ? 'PLC 연결 수정' : 'PLC 연결 추가'}</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">이름</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-muted border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="라인1 PLC"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">IP</label>
              <input
                value={form.ip}
                onChange={(e) => setForm({ ...form, ip: e.target.value })}
                className="w-full px-3 py-2 bg-muted border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="192.168.0.211"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Port</label>
              <input
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-muted border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Protocol</label>
              <select
                value={form.protocol}
                onChange={(e) => setForm({ ...form, protocol: e.target.value as 'TCP' | 'UDP' })}
                className="w-full px-3 py-2 bg-muted border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Timeout (ms)</label>
              <input
                type="number"
                value={form.timeout_ms}
                onChange={(e) => setForm({ ...form, timeout_ms: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-muted border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">재시도 횟수</label>
              <input
                type="number"
                value={form.retry_count}
                onChange={(e) => setForm({ ...form, retry_count: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-muted border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleTest}
                disabled={testing || !form.ip}
                className="w-full px-3 py-2 bg-muted hover:bg-muted/80 border rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Wifi className={cn('h-4 w-4', testing && 'animate-pulse')} />
                {testing ? '테스트 중...' : '연결 테스트'}
              </button>
            </div>
          </div>

          {testResult && (
            <div className={cn(
              'p-3 rounded-lg flex items-center gap-2 text-sm',
              testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            )}>
              {testResult.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {testResult.message}
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name || !form.ip}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

interface AddressModalProps {
  connectionId: string
  data: (PlcAddress & { mapping?: PlcEventMapping }) | null
  onSave: (address: PlcAddress, mapping?: PlcEventMapping) => void
  onClose: () => void
}

function AddressModal({ connectionId, data, onSave, onClose }: AddressModalProps) {
  const [address, setAddress] = useState<PlcAddress>(
    data ? { id: data.id, connection_id: data.connection_id, name: data.name, data_block: data.data_block, address: data.address, description: data.description }
      : { ...DEFAULT_ADDRESS, id: `addr-${Date.now()}`, connection_id: connectionId }
  )
  const [mapping, setMapping] = useState<PlcEventMapping | null>(
    data?.mapping || null
  )
  const [valuesStr, setValuesStr] = useState(data?.mapping?.values.join(', ') || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleEventChange = (eventType: string) => {
    if (eventType) {
      setMapping({
        id: mapping?.id || `map-${Date.now()}`,
        address_id: address.id,
        event_type: eventType,
        values: valuesStr.split(',').map(v => parseInt(v.trim()) || 0),
        enabled: true,
      })
    } else {
      setMapping(null)
    }
  }

  const handleTest = () => {
    setTesting(true)
    setTestResult(null)
    setTimeout(() => {
      const success = Math.random() > 0.3
      setTestResult({ success, message: success ? '전송 성공' : '전송 실패' })
      setTesting(false)
    }, 1000)
  }

  const handleSave = () => {
    const finalMapping = mapping ? {
      ...mapping,
      values: valuesStr.split(',').map(v => parseInt(v.trim()) || 0),
    } : undefined
    onSave(address, finalMapping)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">{data ? '주소 매핑 수정' : '주소 매핑 추가'}</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">이름</label>
            <input
              value={address.name}
              onChange={(e) => setAddress({ ...address, name: e.target.value })}
              className="w-full px-3 py-2 bg-muted border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="작업 시작 신호"
            />
          </div>

          <div className="p-3 bg-muted/50 rounded-lg space-y-3">
            <p className="text-xs font-medium text-muted-foreground">주소 설정</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Data Block</label>
                <input
                  value={address.data_block}
                  onChange={(e) => setAddress({ ...address, data_block: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="D0"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Address</label>
                <input
                  value={address.address}
                  onChange={(e) => setAddress({ ...address, address: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="009400"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg space-y-3">
            <p className="text-xs font-medium text-muted-foreground">이벤트 설정</p>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">이벤트 타입</label>
              <select
                value={mapping?.event_type || ''}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">선택 안함</option>
                {EVENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {mapping && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">전송 값 (U16[])</label>
                <input
                  value={valuesStr}
                  onChange={(e) => setValuesStr(e.target.value)}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="1, 0, 0, 0"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">설명</label>
            <input
              value={address.description}
              onChange={(e) => setAddress({ ...address, description: e.target.value })}
              className="w-full px-3 py-2 bg-muted border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="라인1 작업 트리거"
            />
          </div>

          <button
            onClick={handleTest}
            disabled={testing || !address.data_block || !address.address}
            className="w-full px-3 py-2 bg-muted hover:bg-muted/80 border rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className={cn('h-4 w-4', testing && 'animate-pulse')} />
            {testing ? '테스트 중...' : '수동 전송 테스트'}
          </button>

          {testResult && (
            <div className={cn(
              'p-3 rounded-lg flex items-center gap-2 text-sm',
              testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            )}>
              {testResult.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {testResult.message}
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!address.name || !address.data_block || !address.address}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
