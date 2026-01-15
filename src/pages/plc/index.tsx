import { useState, useEffect, useMemo } from 'react'
import { Cpu, Wifi, WifiOff, RefreshCw, Check, AlertCircle, Settings, Monitor } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import {
  usePlcConnection,
  usePlcConnectionStatus,
  useSavePlcConnection,
  useTestPlcConnection,
  // Camera-specific hooks
  usePlcCameraSettings,
  useSavePlcCameraSettings,
  usePlcCameraEvents,
} from '@features/plc'
import { useCameras } from '@features/camera'

// =============================================================================
// Main Component
// =============================================================================

type TabType = 'connection' | 'monitor'

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
        <p className="text-sm text-muted-foreground mt-1">PLC 연결 상태 확인 및 모니터링</p>
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
      {/* Combined Connection & Status */}
      <div className="max-w-xl">
        <PlcConnectionPanel />
      </div>

      {/* Camera Grid Settings */}
      <div className="mt-6 max-w-6xl">
        <PlcCameraGridSettingsPanel />
      </div>
    </>
  )
}

// =============================================================================
// Combined Connection Panel (연결 설정 + 상태)
// =============================================================================

function PlcConnectionPanel() {
  const { data: connection, isLoading: connectionLoading } = usePlcConnection()
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = usePlcConnectionStatus()
  const saveConnection = useSavePlcConnection()
  const testConnection = useTestPlcConnection()

  const isConnected = status?.connected === true

  // Form state
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
      showToast('success', '저장되었습니다')
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
      refetchStatus()
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
        <div className="flex items-center gap-2">
          {/* Connection Status Badge */}
          <span className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium',
            statusLoading ? 'bg-gray-100 text-gray-500' :
            isConnected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          )}>
            {statusLoading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : isConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {statusLoading ? '확인 중' : isConnected ? '연결됨' : '연결 끊김'}
          </span>
        </div>
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

            {/* Connection Error */}
            {status?.error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {status.error}
              </div>
            )}
          </>
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
    wordCount: 10,
  })
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Sync form with loaded camera settings
  useEffect(() => {
    if (cameraSettings) {
      setForm({
        baseAddress: cameraSettings.baseAddress || 'D0009400',
        wordCount: cameraSettings.wordCount || 10,
      })
    } else {
      // 설정이 없을 때 기본값으로 리셋
      setForm({
        baseAddress: 'D0009400',
        wordCount: 10,
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
    // D 뒤의 숫자 부분 추출 (형식 유지)
    const match = form.baseAddress.match(/^(D)(0*)(\d+)$/)
    if (!match) return { start: '-', end: '-', total: 0 }
    const [, prefix, zeros, numStr] = match
    const baseNum = parseInt(numStr, 10)
    const endNum = baseNum + form.wordCount - 1
    // 원본 숫자 길이 유지
    const totalDigits = zeros.length + numStr.length
    return {
      start: form.baseAddress,
      end: `${prefix}${String(endNum).padStart(totalDigits, '0')}`,
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
                  {saveSettings.isPending ? '저장 중...' : '설정 저장'}
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
// Shared Utilities
// =============================================================================

// 비트 범위 (0 ~ 15) - 16비트 고정
const BIT_RANGE = Array.from({ length: 16 }, (_, i) => i)

// 동적 주소 범위 생성 함수
function generateAddressRange(baseAddress: string, wordCount: number): string[] {
  // baseAddress 예: "D0009400" 또는 "D9400"
  // D 접두사와 숫자 부분 추출 (형식 유지)
  const match = baseAddress.match(/^(D)(0*)(\d+)$/)
  if (!match) return []

  const [, prefix, zeros, numStr] = match
  const baseNum = parseInt(numStr, 10)
  const totalDigits = zeros.length + numStr.length
  const addresses: string[] = []

  for (let i = 0; i < wordCount; i++) {
    // 원본 형식 유지 (예: D09400 → D09401, D09402...)
    addresses.push(`${prefix}${String(baseNum + i).padStart(totalDigits, '0')}`)
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
