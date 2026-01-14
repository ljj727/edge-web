import { useState, useEffect, useCallback, useMemo, DragEvent } from 'react'
import { Cpu, Wifi, WifiOff, Send, RefreshCw, Check, AlertCircle, Save, Settings, Zap, Plus, Trash2, Edit2, Download, Monitor, GripVertical, X } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import {
  usePlcConnection,
  usePlcConnectionStatus,
  usePlcLogs,
  useSavePlcConnection,
  useTestPlcConnection,
  usePlcSend,
  usePlcEvents,
  useUpdatePlcEvent,
  useSeedPlcEvents,
  usePlcSettings,
  useSavePlcSettings,
  // Camera-specific hooks
  usePlcCameraSettings,
  useSavePlcCameraSettings,
  usePlcCameraEvents,
  useUpdatePlcCameraEvent,
  useSeedPlcCameraEvents,
} from '@features/plc'
import { useCameras } from '@features/camera'
import { useInferences } from '@features/inference'
import { useApps } from '@features/app'
import type { PlcConnectionCreate, PlcEventConfig, PlcSettings } from '@shared/types'

// =============================================================================
// Main Component
// =============================================================================

type TabType = 'connection' | 'events' | 'monitor'

export function PlcPage() {
  const [activeTab, setActiveTab] = useState<TabType>('connection')

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          <h1 className="text-xl font-semibold">PLC 설정</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">PLC 연결 상태 확인 및 이벤트 매핑 설정</p>
      </div>

      {/* Content with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r bg-muted/30 p-3 shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('connection')}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'connection'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Settings className="h-4 w-4" />
              연결 설정
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'events'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Zap className="h-4 w-4" />
              이벤트 설정
            </button>
            <button
              onClick={() => setActiveTab('monitor')}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'monitor'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Monitor className="h-4 w-4" />
              이벤트 현황
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'connection' ? (
            <PlcConnectionContent />
          ) : activeTab === 'events' ? (
            <PlcEventSettingsPanel />
          ) : (
            <PlcEventMonitorPanel />
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Connection Settings Content (Original Layout)
// =============================================================================

function PlcConnectionContent() {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
        {/* Left: Status */}
        <PlcStatusPanel />

        {/* Right: Config & Test */}
        <PlcConfigPanel />
      </div>

      {/* Camera Grid Settings */}
      <div className="mt-6 max-w-6xl">
        <PlcCameraGridSettingsPanel />
      </div>

      {/* Bottom: TX History */}
      <div className="mt-6 max-w-6xl">
        <PlcHistoryPanel />
      </div>
    </>
  )
}

// =============================================================================
// Status Panel (Left)
// =============================================================================

function PlcStatusPanel() {
  const { data: connection } = usePlcConnection()
  const { data: status, isLoading, refetch } = usePlcConnectionStatus()

  const isConnected = status?.connected === true

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold">PLC Status</h2>
        <button
          onClick={() => refetch()}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        </button>
      </div>
      <div className="p-4 space-y-4">
        {/* Connection Status Icon */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
            </div>
          ) : isConnected ? (
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Wifi className="h-6 w-6 text-green-500" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <WifiOff className="h-6 w-6 text-red-500" />
            </div>
          )}
          <div>
            <span className={cn(
              'px-2 py-1 rounded text-sm font-medium',
              isConnected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            )}>
              {isLoading ? '확인 중...' : isConnected ? '연결됨' : '연결 끊김'}
            </span>
          </div>
        </div>

        {/* Status Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Enabled</span>
            <span className="font-medium">{connection?.enabled ? 'true' : 'false'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IP</span>
            <span className="font-mono">{connection?.ip || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Port</span>
            <span className="font-mono">{connection?.port || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Address</span>
            <span className="font-mono">{status?.address || 'D0009400'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">WordCount</span>
            <span className="font-mono">{status?.word_count || '-'}</span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last sent</span>
            <span className="font-mono">{status?.last_sent || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last recv(hex)</span>
            <span className="font-mono text-xs truncate max-w-[200px]">{status?.last_recv_hex || '-'}</span>
          </div>
        </div>

        {status?.error && (
          <div className="border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Error</span>
              <span className="text-red-500">{status.error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Config Panel (Right)
// =============================================================================

function PlcConfigPanel() {
  const { data: connection, isLoading: connectionLoading } = usePlcConnection()
  const saveConnection = useSavePlcConnection()
  const testConnection = useTestPlcConnection()

  // Form state - IP와 Port만
  const [form, setForm] = useState({
    name: 'PLC',
    ip: '192.168.0.211',
    port: 10260,
    enabled: true,
  })

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Sync form with loaded connection
  useEffect(() => {
    if (connection) {
      setForm({
        name: connection.name || 'PLC',
        ip: connection.ip || '192.168.0.211',
        port: connection.port || 10260,
        enabled: connection.enabled ?? true,
      })
    }
  }, [connection])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    try {
      await saveConnection.mutateAsync({
        name: form.name,
        ip: form.ip,
        port: form.port,
        protocol: 'TCP',
        timeout_ms: 1000,
        retry_count: 3,
        enabled: form.enabled,
      })
      showToast('success', '연결 설정이 저장되었습니다')
    } catch (err) {
      showToast('error', '저장 실패')
    }
  }

  const handleTest = async () => {
    if (!connection) {
      setTestResult({ success: false, message: '먼저 설정을 저장해주세요' })
      return
    }
    setTestResult(null)
    try {
      const result = await testConnection.mutateAsync()
      setTestResult({
        success: result.success,
        message: result.success ? `연결 성공 (${result.response_time_ms}ms)` : (result.error || '연결 실패'),
      })
    } catch (err) {
      setTestResult({ success: false, message: '연결 실패' })
    }
  }

  const handleToggleEnable = async (enabled: boolean) => {
    setForm(prev => ({ ...prev, enabled }))
    if (connection) {
      try {
        await saveConnection.mutateAsync({
          name: form.name,
          ip: form.ip,
          port: form.port,
          protocol: 'TCP',
          timeout_ms: 1000,
          retry_count: 3,
          enabled,
        })
        showToast('success', enabled ? 'PLC 활성화됨' : 'PLC 비활성화됨')
      } catch (err) {
        showToast('error', '변경 실패')
      }
    }
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm relative">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'absolute top-2 right-2 px-3 py-1.5 rounded-lg text-xs font-medium z-10 shadow-lg',
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        )}>
          {toast.message}
        </div>
      )}

      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold">PLC 연결</h2>
        <span className={cn(
          'px-2 py-0.5 rounded text-xs font-medium',
          form.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
        )}>
          {form.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {connectionLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* IP & Port */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">IP Address</label>
                <input
                  value={form.ip}
                  onChange={(e) => setForm({ ...form, ip: e.target.value })}
                  placeholder="192.168.0.211"
                  className="w-full px-3 py-2 bg-muted border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Port</label>
                <input
                  type="number"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                  placeholder="10260"
                  className="w-full px-3 py-2 bg-muted border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saveConnection.isPending}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saveConnection.isPending ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={handleTest}
                disabled={testConnection.isPending || !connection}
                className="px-4 py-2 bg-muted hover:bg-muted/80 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {testConnection.isPending ? '테스트 중...' : '연결 테스트'}
              </button>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">PLC 전송 활성화</span>
              <button
                onClick={() => handleToggleEnable(!form.enabled)}
                disabled={saveConnection.isPending}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  form.enabled ? 'bg-green-500' : 'bg-gray-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    form.enabled ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={cn(
                'p-3 rounded-lg flex items-center gap-2 text-sm',
                testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              )}>
                {testResult.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {testResult.message}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// History Panel (Bottom)
// =============================================================================

function PlcHistoryPanel() {
  const { data: logsData, refetch } = usePlcLogs(20)
  const logs = logsData?.logs || []

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold">PLC TX History</h2>
        <button
          onClick={() => refetch()}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No history</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Time</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Address</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Values</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">OK</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Note</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 px-3 font-mono text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-mono text-xs">
                      {log.data_block}:{log.address}
                    </td>
                    <td className="py-2 px-3 font-mono text-xs">
                      [{(log.values || []).slice(0, 4).join(', ')}{(log.values?.length || 0) > 4 ? '...' : ''}]
                    </td>
                    <td className="py-2 px-3">
                      {log.success ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">
                      {log.success ? `${log.response_time_ms}ms` : log.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Camera Grid Settings Panel (카메라별 Grid 설정)
// =============================================================================

function PlcCameraGridSettingsPanel() {
  const { data: cameras } = useCameras()
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)

  // 첫 번째 카메라 자동 선택
  useEffect(() => {
    if (cameras && cameras.length > 0 && !selectedCameraId) {
      setSelectedCameraId(cameras[0].id)
    }
  }, [cameras, selectedCameraId])

  const { data: rawCameraSettings, isLoading } = usePlcCameraSettings(selectedCameraId)
  const saveSettings = useSavePlcCameraSettings()

  // cameraSettings 정규화 (camelCase/snake_case 호환)
  const cameraSettings = useMemo(() => {
    if (!rawCameraSettings) return null
    return {
      cameraId: rawCameraSettings.camera_id || (rawCameraSettings as any).cameraId || '',
      baseAddress: rawCameraSettings.base_address || (rawCameraSettings as any).baseAddress || '',
      wordCount: rawCameraSettings.word_count ?? (rawCameraSettings as any).wordCount ?? 0,
    }
  }, [rawCameraSettings])

  const [form, setForm] = useState({
    baseAddress: 'D0009400',
    wordCount: 51,
  })
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Sync form with loaded camera settings
  useEffect(() => {
    if (cameraSettings) {
      setForm({
        baseAddress: cameraSettings.baseAddress || 'D0009400',
        wordCount: cameraSettings.wordCount || 51,
      })
    } else {
      // 설정이 없을 때 기본값으로 리셋
      setForm({
        baseAddress: 'D0009400',
        wordCount: 51,
      })
    }
  }, [cameraSettings, selectedCameraId])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    if (!selectedCameraId) return
    try {
      await saveSettings.mutateAsync({
        cameraId: selectedCameraId,
        data: {
          base_address: form.baseAddress,
          word_count: form.wordCount,
        },
      })
      showToast('success', 'Grid 설정이 저장되었습니다')
    } catch (err) {
      showToast('error', '저장 실패')
    }
  }

  // 미리보기용 주소 범위
  const previewRange = useMemo(() => {
    if (!form.baseAddress || form.wordCount <= 0) return { start: '-', end: '-', total: 0 }
    const match = form.baseAddress.match(/D0*(\d+)/)
    if (!match) return { start: '-', end: '-', total: 0 }
    const baseNum = parseInt(match[1], 10)
    return {
      start: form.baseAddress,
      end: `D${String(baseNum + form.wordCount - 1).padStart(7, '0')}`,
      total: form.wordCount * 16,
    }
  }, [form.baseAddress, form.wordCount])

  const selectedCamera = cameras?.find(c => c.id === selectedCameraId)

  return (
    <div className="bg-card rounded-xl border shadow-sm relative">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'absolute top-2 right-2 px-3 py-1.5 rounded-lg text-xs font-medium z-10 shadow-lg',
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        )}>
          {toast.message}
        </div>
      )}

      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold">카메라별 Grid 설정</h2>
        {cameraSettings && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-600">
            설정됨
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Camera Selection */}
        <div>
          <label className="block text-xs text-muted-foreground mb-2">카메라 선택</label>
          <div className="flex flex-wrap gap-2">
            {cameras?.map((camera) => (
              <button
                key={camera.id}
                onClick={() => setSelectedCameraId(camera.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  selectedCameraId === camera.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                )}
              >
                {camera.name}
              </button>
            ))}
            {(!cameras || cameras.length === 0) && (
              <p className="text-sm text-muted-foreground">카메라가 없습니다</p>
            )}
          </div>
        </div>

        {selectedCameraId && (
          <>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                  선택된 카메라: <span className="font-medium text-foreground">{selectedCamera?.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Base Address</label>
                    <input
                      value={form.baseAddress}
                      onChange={(e) => setForm({ ...form, baseAddress: e.target.value })}
                      placeholder="D0009400"
                      className="w-full px-3 py-2 bg-muted border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Word Count</label>
                    <input
                      type="number"
                      value={form.wordCount}
                      onChange={(e) => setForm({ ...form, wordCount: Number(e.target.value) })}
                      min={1}
                      max={100}
                      className="w-full px-3 py-2 bg-muted border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <div className="text-xs text-muted-foreground mb-2">미리보기</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">시작:</span>
                      <span className="font-mono ml-1">{previewRange.start}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">끝:</span>
                      <span className="font-mono ml-1">{previewRange.end}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">총 셀:</span>
                      <span className="font-mono ml-1">{previewRange.total}개</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {form.wordCount}개 주소 × 16 비트 = {previewRange.total}개 셀
                  </p>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saveSettings.isPending}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saveSettings.isPending ? '저장 중...' : 'Grid 설정 저장'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Event Settings Panel - Drag & Drop
// =============================================================================

// 비트 범위 (0 ~ 15) - 16비트 고정
const BIT_RANGE = Array.from({ length: 16 }, (_, i) => i)

// 동적 주소 범위 생성 함수
function generateAddressRange(baseAddress: string, wordCount: number): string[] {
  // baseAddress 예: "D0009400" 또는 "D9400"
  // D 접두사 제거하고 숫자 추출
  const match = baseAddress.match(/D0*(\d+)/)
  if (!match) return []

  const baseNum = parseInt(match[1], 10)
  const addresses: string[] = []

  for (let i = 0; i < wordCount; i++) {
    // D + 7자리 숫자 형식 (예: D0009400)
    addresses.push(`D${String(baseNum + i).padStart(7, '0')}`)
  }

  return addresses
}

// 라벨별 색상 (동적 생성용)
const LABEL_COLOR_PALETTE = [
  'bg-blue-500', 'bg-blue-400', 'bg-green-500', 'bg-green-400',
  'bg-yellow-500', 'bg-yellow-400', 'bg-purple-500', 'bg-purple-400',
  'bg-orange-500', 'bg-red-500', 'bg-pink-500', 'bg-pink-400',
  'bg-cyan-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
  'bg-amber-500', 'bg-lime-500', 'bg-emerald-500', 'bg-sky-500',
]

// 라벨에 색상 할당 (일관성 유지를 위해 해시 기반)
function getLabelColor(label: string): string {
  let hash = 0
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash)
  }
  return LABEL_COLOR_PALETTE[Math.abs(hash) % LABEL_COLOR_PALETTE.length]
}

// API 응답의 eventType(camelCase)을 event_type으로 정규화
interface NormalizedEvent {
  eventType: string
  label: string
  address: string
  bit: number | null
  enabled: boolean
}

function normalizeEvent(event: any): NormalizedEvent {
  return {
    eventType: event.eventType || event.event_type || '',
    label: event.label || '',
    address: event.address || '',
    bit: event.bit,
    enabled: event.enabled ?? true,
  }
}

// cameraSettings 정규화 (API가 camelCase 또는 snake_case로 반환할 수 있음)
interface NormalizedCameraSettings {
  cameraId: string
  baseAddress: string
  wordCount: number
}

function normalizeCameraSettings(settings: any): NormalizedCameraSettings | null {
  if (!settings) return null
  return {
    cameraId: settings.camera_id || settings.cameraId || '',
    baseAddress: settings.base_address || settings.baseAddress || '',
    wordCount: settings.word_count ?? settings.wordCount ?? 0,
  }
}

function PlcEventSettingsPanel() {
  // 카메라, Inference, App 데이터
  const { data: cameras } = useCameras()
  const { data: inferences } = useInferences()
  const { data: apps } = useApps()

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [draggedLabel, setDraggedLabel] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ address: string; bit: number } | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // 첫 번째 카메라 자동 선택
  useEffect(() => {
    if (cameras && cameras.length > 0 && !selectedCameraId) {
      setSelectedCameraId(cameras[0].id)
    }
  }, [cameras, selectedCameraId])

  // 카메라별 Settings & Events
  const { data: rawCameraSettings } = usePlcCameraSettings(selectedCameraId)
  const { data: rawEvents, isLoading, refetch } = usePlcCameraEvents(selectedCameraId)
  const updateEvent = useUpdatePlcCameraEvent()
  const seedEvents = useSeedPlcCameraEvents()

  // cameraSettings 정규화 (camelCase/snake_case 호환)
  const cameraSettings = useMemo(() => {
    return normalizeCameraSettings(rawCameraSettings)
  }, [rawCameraSettings])

  // 선택된 카메라 객체
  const selectedCamera = useMemo(() => {
    if (!selectedCameraId || !cameras) return null
    return cameras.find(c => c.id === selectedCameraId)
  }, [selectedCameraId, cameras])

  // 선택된 카메라의 Inference 찾기
  const selectedInference = useMemo(() => {
    if (!selectedCameraId || !inferences) return null
    return inferences.find(inf => inf.videoId === selectedCameraId)
  }, [selectedCameraId, inferences])

  // 선택된 카메라의 App 찾기
  const selectedApp = useMemo(() => {
    if (!selectedInference || !apps) return null
    return apps.find(app => app.id === selectedInference.appId)
  }, [selectedInference, apps])

  // 선택된 카메라의 라벨 목록
  // outputs가 있으면 outputs.label, 없으면 models[0].labels에서 가져옴
  const availableLabels = useMemo(() => {
    if (!selectedApp) return []

    // 1. outputs에서 가져오기 시도
    if (selectedApp.outputs && selectedApp.outputs.length > 0) {
      return selectedApp.outputs.map(output => output.label)
    }

    // 2. models[0].labels에서 가져오기
    if (selectedApp.models && selectedApp.models.length > 0 && selectedApp.models[0].labels) {
      return selectedApp.models[0].labels
    }

    return []
  }, [selectedApp])

  // 이벤트 정규화 (camelCase → 통일)
  const events = useMemo(() => {
    return rawEvents?.map(normalizeEvent) || []
  }, [rawEvents])

  // 동적 주소 범위 생성 (cameraSettings 기반)
  const addressRange = useMemo(() => {
    if (!cameraSettings?.baseAddress || !cameraSettings?.wordCount) {
      return []
    }
    return generateAddressRange(cameraSettings.baseAddress, cameraSettings.wordCount)
  }, [cameraSettings?.baseAddress, cameraSettings?.wordCount])

  // DEBUG: Log raw API response
  useEffect(() => {
    console.log('=== PLC Camera Settings Debug ===')
    console.log('selectedCameraId:', selectedCameraId)
    console.log('rawCameraSettings:', rawCameraSettings)
    console.log('normalized cameraSettings:', cameraSettings)
    if (rawCameraSettings) {
      console.log('rawCameraSettings keys:', Object.keys(rawCameraSettings))
    }
  }, [rawCameraSettings, cameraSettings, selectedCameraId])

  useEffect(() => {
    if (rawEvents && rawEvents.length > 0) {
      console.log('PLC Events raw data:', rawEvents)
      console.log('First event keys:', Object.keys(rawEvents[0]))
      console.log('First event:', rawEvents[0])
    }
  }, [rawEvents])

  // 배치되지 않은 라벨들 (현재 그리드에 없는 것들)
  const unplacedLabels = useMemo(() => {
    const placedEventTypes = events.filter(e => e.bit !== null).map(e => e.eventType)
    return availableLabels.filter(label => !placedEventTypes.includes(label))
  }, [availableLabels, events])

  // 배치된 이벤트들
  const placedEvents = events.filter(e => e.bit !== null)

  // 주소+비트로 이벤트 찾기
  const getEventAt = (address: string, bit: number): NormalizedEvent | undefined => {
    return events.find(e => e.address === address && e.bit === bit)
  }

  // 드래그 시작
  const handleDragStart = (e: DragEvent, label: string) => {
    setDraggedLabel(label)
    e.dataTransfer.setData('text/plain', label)
    e.dataTransfer.effectAllowed = 'move'
  }

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedLabel(null)
    setDropTarget(null)
  }

  // 드래그 오버
  const handleDragOver = (e: DragEvent, address: string, bit: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget({ address, bit })
  }

  // 드래그 리브
  const handleDragLeave = () => {
    setDropTarget(null)
  }

  // 드롭 - 라벨을 eventType으로 사용
  const handleDrop = async (e: DragEvent, address: string, bit: number) => {
    e.preventDefault()
    const label = e.dataTransfer.getData('text/plain')
    if (!label || !selectedCameraId) return

    setDropTarget(null)
    setDraggedLabel(null)
    setSaveStatus('saving')

    try {
      // 라벨을 eventType으로 사용하여 이벤트 업데이트 (카메라별)
      await updateEvent.mutateAsync({
        cameraId: selectedCameraId,
        eventType: label,
        data: { address, bit, label },
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1500)
    } catch (err) {
      console.error('Failed to update event:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  // 셀에서 이벤트 제거
  const handleRemoveFromCell = async (label: string) => {
    if (!selectedCameraId) return
    setSaveStatus('saving')
    try {
      await updateEvent.mutateAsync({
        cameraId: selectedCameraId,
        eventType: label,
        data: { bit: null },
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1500)
    } catch (err) {
      console.error('Failed to remove event:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  // 기본 이벤트 생성 (카메라별)
  const handleSeedEvents = async () => {
    if (!selectedCameraId) return
    try {
      await seedEvents.mutateAsync(selectedCameraId)
      refetch()
    } catch (err) {
      console.error('Failed to seed events:', err)
    }
  }

  if (!selectedCameraId) {
    return (
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>카메라가 없습니다</p>
          <p className="text-xs mt-1">먼저 카메라를 추가해주세요</p>
        </div>
      </div>
    )
  }

  if (addressRange.length === 0) {
    return (
      <div className="space-y-4">
        {/* Camera Selection Tabs */}
        <div className="bg-card rounded-xl border shadow-sm p-4">
          <div className="text-xs font-medium text-muted-foreground mb-3">카메라 선택</div>
          <div className="flex flex-wrap gap-2">
            {cameras?.map((camera) => (
              <button
                key={camera.id}
                onClick={() => setSelectedCameraId(camera.id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  selectedCameraId === camera.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                )}
              >
                {camera.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm p-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>선택한 카메라의 Grid 설정이 없습니다</p>
            <p className="text-xs mt-1">연결 설정 탭에서 카메라별 Grid 설정을 먼저 완료해주세요</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">이벤트 설정</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            카메라별 감지 라벨을 드래그하여 그리드에 배치하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus !== 'idle' && (
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded',
              saveStatus === 'saving' && 'bg-blue-100 text-blue-600',
              saveStatus === 'saved' && 'bg-green-100 text-green-600',
              saveStatus === 'error' && 'bg-red-100 text-red-600'
            )}>
              {saveStatus === 'saving' && '저장 중...'}
              {saveStatus === 'saved' && '저장됨'}
              {saveStatus === 'error' && '오류'}
            </span>
          )}
          {events.length === 0 && selectedCameraId && (
            <button
              onClick={handleSeedEvents}
              disabled={seedEvents.isPending}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {seedEvents.isPending ? '생성 중...' : '기본 이벤트 생성'}
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Camera Selection Tabs */}
      <div className="bg-card rounded-xl border shadow-sm p-4">
        <div className="text-xs font-medium text-muted-foreground mb-3">
          카메라 선택
        </div>
        <div className="flex flex-wrap gap-2">
          {cameras?.map((camera) => (
            <button
              key={camera.id}
              onClick={() => setSelectedCameraId(camera.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedCameraId === camera.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              )}
            >
              {camera.name}
            </button>
          ))}
          {(!cameras || cameras.length === 0) && (
            <p className="text-sm text-muted-foreground">카메라가 없습니다</p>
          )}
        </div>
        {selectedCamera && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            <span className="font-medium">선택됨:</span> {selectedCamera.name}
            {selectedApp && (
              <span className="ml-2">
                → Vision App: <span className="font-mono">{selectedApp.name || selectedApp.id}</span>
              </span>
            )}
            {!selectedApp && selectedInference && (
              <span className="ml-2 text-amber-500">
                (App 연결 필요)
              </span>
            )}
            {!selectedInference && (
              <span className="ml-2 text-amber-500">
                (Inference 설정 필요)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Draggable Labels from Selected Camera's App */}
      <div className="bg-card rounded-xl border shadow-sm p-4">
        <div className="text-xs font-medium text-muted-foreground mb-3">
          미배치 라벨 ({unplacedLabels.length}개) - 드래그하여 그리드에 배치
        </div>
        <div className="flex flex-wrap gap-2">
          {unplacedLabels.map((label) => (
            <div
              key={label}
              draggable
              onDragStart={(e) => handleDragStart(e, label)}
              onDragEnd={handleDragEnd}
              className={cn(
                'px-2 py-1 rounded text-xs font-semibold cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow-md hover:scale-105',
                getLabelColor(label),
                'text-white border border-white/20',
                draggedLabel === label && 'opacity-50 scale-95'
              )}
              title={label}
            >
              {label}
            </div>
          ))}
          {unplacedLabels.length === 0 && availableLabels.length > 0 && (
            <p className="text-sm text-muted-foreground">모든 라벨이 배치되었습니다</p>
          )}
          {availableLabels.length === 0 && selectedApp && (
            <p className="text-sm text-muted-foreground">이 App에 출력 라벨이 없습니다</p>
          )}
          {!selectedApp && (
            <p className="text-sm text-muted-foreground">카메라를 선택하고 Vision App을 연결해주세요</p>
          )}
        </div>
      </div>

      {/* Bitmap Grid */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-2 bg-zinc-800 text-zinc-300 text-sm font-medium">
          D Device Bit Grid
        </div>

        {isLoading ? (
          <div className="p-8">
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-700 text-zinc-300">
                  <th className="py-2 px-3 text-left font-medium border-r border-zinc-600 w-20">CARD</th>
                  {BIT_RANGE.map(bit => (
                    <th key={bit} className="py-2 px-1 text-center font-medium border-r border-zinc-600 w-14 text-xs">
                      {bit}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {addressRange.map((address) => (
                  <tr key={address} className="border-b border-zinc-200">
                    <td className="py-1 px-2 font-mono text-xs bg-zinc-100 border-r font-medium">
                      {address.replace('D000', 'D')}
                    </td>
                    {BIT_RANGE.map(bit => {
                      const event = getEventAt(address, bit)
                      const isDropTarget = dropTarget?.address === address && dropTarget?.bit === bit

                      return (
                        <td
                          key={bit}
                          onDragOver={(e) => handleDragOver(e, address, bit)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, address, bit)}
                          className={cn(
                            'py-0.5 px-0.5 text-center border-r border-zinc-200 transition-all h-10',
                            isDropTarget && 'bg-primary/30 ring-2 ring-primary ring-inset',
                            !event && !isDropTarget && 'bg-zinc-50 hover:bg-zinc-100'
                          )}
                        >
                          {event ? (
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, event.eventType)}
                              onDragEnd={handleDragEnd}
                              className={cn(
                                'relative group px-0.5 py-1 rounded text-[9px] font-bold text-white cursor-grab active:cursor-grabbing',
                                getLabelColor(event.eventType),
                                draggedLabel === event.eventType && 'opacity-50'
                              )}
                              title={`${event.eventType}: ${event.label}`}
                            >
                              {event.eventType.length > 6 ? event.eventType.slice(0, 6) + '..' : event.eventType}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveFromCell(event.eventType)
                                }}
                                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                              >
                                <X className="h-2 w-2" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-300">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Placed Events Summary */}
      <div className="bg-muted/30 rounded-xl border p-4">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          배치된 이벤트 ({placedEvents.length}개)
        </div>
        <div className="flex flex-wrap gap-1.5">
          {placedEvents.map((event) => (
            <span
              key={event.eventType}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium text-white',
                getLabelColor(event.eventType)
              )}
            >
              {event.eventType} → {event.address.replace('D000', 'D')}[{event.bit}]
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Event Monitor Panel - Read Only
// =============================================================================

function PlcEventMonitorPanel() {
  const { data: cameras } = useCameras()
  const { data: status } = usePlcConnectionStatus()
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)

  // 첫 번째 카메라 자동 선택
  useEffect(() => {
    if (cameras && cameras.length > 0 && !selectedCameraId) {
      setSelectedCameraId(cameras[0].id)
    }
  }, [cameras, selectedCameraId])

  const { data: rawCameraSettings } = usePlcCameraSettings(selectedCameraId)
  const { data: rawEvents, isLoading, refetch } = usePlcCameraEvents(selectedCameraId)

  // cameraSettings 정규화 (camelCase/snake_case 호환)
  const cameraSettings = useMemo(() => {
    return normalizeCameraSettings(rawCameraSettings)
  }, [rawCameraSettings])

  // 이벤트 정규화 (camelCase → 통일)
  const events = useMemo(() => {
    return rawEvents?.map(normalizeEvent) || []
  }, [rawEvents])

  // 동적 주소 범위 생성 (cameraSettings 기반)
  const addressRange = useMemo(() => {
    if (!cameraSettings?.baseAddress || !cameraSettings?.wordCount) {
      return []
    }
    return generateAddressRange(cameraSettings.baseAddress, cameraSettings.wordCount)
  }, [cameraSettings?.baseAddress, cameraSettings?.wordCount])

  // 주소+비트로 이벤트 찾기
  const getEventAt = (address: string, bit: number): NormalizedEvent | undefined => {
    return events.find(e => e.address === address && e.bit === bit && e.enabled)
  }

  if (!selectedCameraId) {
    return (
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>카메라가 없습니다</p>
        </div>
      </div>
    )
  }

  if (addressRange.length === 0) {
    return (
      <div className="space-y-4">
        {/* Camera Selection */}
        <div className="bg-card rounded-xl border shadow-sm p-4">
          <div className="text-xs font-medium text-muted-foreground mb-3">카메라 선택</div>
          <div className="flex flex-wrap gap-2">
            {cameras?.map((camera) => (
              <button
                key={camera.id}
                onClick={() => setSelectedCameraId(camera.id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  selectedCameraId === camera.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                )}
              >
                {camera.name}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>선택한 카메라의 Grid 설정이 없습니다</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">이벤트 현황</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            현재 매핑된 이벤트 현황 (읽기 전용)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
            status?.connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          )}>
            {status?.connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {status?.connected ? '연결됨' : '연결 안됨'}
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Camera Selection */}
      <div className="bg-card rounded-xl border shadow-sm p-4">
        <div className="text-xs font-medium text-muted-foreground mb-3">카메라 선택</div>
        <div className="flex flex-wrap gap-2">
          {cameras?.map((camera) => (
            <button
              key={camera.id}
              onClick={() => setSelectedCameraId(camera.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedCameraId === camera.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              )}
            >
              {camera.name}
            </button>
          ))}
        </div>
      </div>

      {/* Monitor Grid */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-2 bg-zinc-800 text-zinc-300 text-sm font-medium flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          D Device Bit Monitor
        </div>

        {isLoading ? (
          <div className="p-8">
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-700 text-zinc-300">
                  <th className="py-2 px-3 text-left font-medium border-r border-zinc-600 w-20">CARD</th>
                  {BIT_RANGE.map(bit => (
                    <th key={bit} className="py-2 px-1 text-center font-medium border-r border-zinc-600 w-14 text-xs">
                      {bit}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {addressRange.map((address) => (
                  <tr key={address} className="border-b border-zinc-200">
                    <td className="py-1.5 px-2 font-mono text-xs bg-zinc-100 border-r font-medium">
                      {address.replace('D000', 'D')}
                    </td>
                    {BIT_RANGE.map(bit => {
                      const event = getEventAt(address, bit)
                      return (
                        <td
                          key={bit}
                          className={cn(
                            'py-1 px-0.5 text-center border-r border-zinc-200 h-10',
                            event
                              ? getLabelColor(event.eventType)
                              : 'bg-zinc-50'
                          )}
                        >
                          {event ? (
                            <span
                              className="text-[9px] font-bold text-white block"
                              title={`${event.eventType}: ${event.label}`}
                            >
                              {event.eventType.length > 6 ? event.eventType.slice(0, 6) + '..' : event.eventType}
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-300">0</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-card rounded-xl border shadow-sm p-4">
        <div className="text-xs font-medium text-muted-foreground mb-3">범례 (활성화된 이벤트)</div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {events.filter(e => e.enabled && e.bit !== null).map((event) => (
            <div key={event.eventType} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-3 rounded', getLabelColor(event.eventType))} />
              <span className="text-[10px] font-medium truncate">{event.eventType}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event List */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-2 bg-muted/50 border-b">
          <span className="text-sm font-medium">전체 이벤트 목록</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/90 backdrop-blur">
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Event</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Label</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-20">Address</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">Bit</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-16">상태</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.eventType} className={cn('border-b last:border-0', !event.enabled && 'opacity-40')}>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded', getLabelColor(event.eventType))} />
                      <code className="text-xs font-medium">{event.eventType}</code>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">{event.label}</td>
                  <td className="py-2 px-3 text-center">
                    <code className="text-xs font-mono">{event.address.replace('D000', 'D')}</code>
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-xs">
                    {event.bit !== null ? event.bit : '-'}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-bold',
                      event.enabled && event.bit !== null
                        ? 'bg-green-100 text-green-700'
                        : 'bg-zinc-100 text-zinc-500'
                    )}>
                      {event.enabled && event.bit !== null ? 'ACTIVE' : 'OFF'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
