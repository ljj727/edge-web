import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@shared/ui'
import { Settings, Key, RefreshCw, Power, AlertTriangle, Radio, CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react'
import { dxApi } from '@features/dx'
import { useMediaMTXSettings, useUpdateMediaMTXSettings, useResetMediaMTXSettings, useTestMediaMTXConnection } from '@features/mediamtx'
import { useSystemRestart, type RestartStep } from '@features/system'
import { useState, useEffect } from 'react'
import { cn } from '@shared/lib/cn'

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [licenseKey, setLicenseKey] = useState('')

  // System restart state
  const [restartSteps, setRestartSteps] = useState<RestartStep[]>([])
  const [isRestarting, setIsRestarting] = useState(false)
  const { restart } = useSystemRestart()

  const handleRestart = async () => {
    setIsRestarting(true)
    setRestartSteps([])

    await restart((step) => {
      setRestartSteps((prev) => {
        const existing = prev.findIndex((s) => s.step === step.step)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = step
          return updated
        }
        return [...prev, step]
      })
    })

    setIsRestarting(false)
  }

  // MediaMTX state - simplified to IP + ports
  const [mxForm, setMxForm] = useState({
    host: 'localhost',
    apiPort: '9997',
    hlsPort: '8888',
    webrtcPort: '8889',
    rtspPort: '8554',
    enabled: true,
  })
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // MediaMTX hooks
  const { data: mediamtxSettings, isLoading: mediamtxLoading } = useMediaMTXSettings()
  const updateMediamtxMutation = useUpdateMediaMTXSettings()
  const resetMediamtxMutation = useResetMediaMTXSettings()
  const testMediamtxMutation = useTestMediaMTXConnection()

  // Helper to parse URL into host and port
  const parseUrl = (url: string, defaultPort: string) => {
    try {
      if (url.startsWith('rtsp://')) {
        const match = url.match(/rtsp:\/\/([^:\/]+):?(\d+)?/)
        return { host: match?.[1] || 'localhost', port: match?.[2] || defaultPort }
      }
      const parsed = new URL(url)
      return { host: parsed.hostname, port: parsed.port || defaultPort }
    } catch {
      return { host: 'localhost', port: defaultPort }
    }
  }

  // Sync form with fetched settings
  useEffect(() => {
    if (mediamtxSettings) {
      const api = parseUrl(mediamtxSettings.api_url, '9997')
      const hls = parseUrl(mediamtxSettings.hls_url, '8888')
      const webrtc = parseUrl(mediamtxSettings.webrtc_url, '8889')
      const rtsp = parseUrl(mediamtxSettings.rtsp_url, '8554')

      setMxForm({
        host: api.host,
        apiPort: api.port,
        hlsPort: hls.port,
        webrtcPort: webrtc.port,
        rtspPort: rtsp.port,
        enabled: mediamtxSettings.enabled,
      })
    }
  }, [mediamtxSettings])

  // Build full URLs from host + ports for backend
  const buildUrls = () => ({
    api_url: `http://${mxForm.host}:${mxForm.apiPort}/v3`,
    hls_url: `http://${mxForm.host}:${mxForm.hlsPort}`,
    webrtc_url: `http://${mxForm.host}:${mxForm.webrtcPort}`,
    rtsp_url: `rtsp://${mxForm.host}:${mxForm.rtspPort}`,
    enabled: mxForm.enabled,
  })

  const handleMediamtxSave = () => {
    updateMediamtxMutation.mutate(buildUrls(), {
      onSuccess: () => setTestResult(null),
    })
  }

  const handleMediamtxReset = () => {
    resetMediamtxMutation.mutate(undefined, {
      onSuccess: () => setTestResult(null),
    })
  }

  const handleMediamtxTest = async () => {
    const result = await testMediamtxMutation.mutateAsync()
    setTestResult(result)
  }

  const { data: dx, isLoading: dxLoading } = useQuery({
    queryKey: ['dx'],
    queryFn: dxApi.getInfo,
  })

  const { data: license, isLoading: licenseLoading } = useQuery({
    queryKey: ['license'],
    queryFn: dxApi.getLicense,
  })


  const activateLicenseMutation = useMutation({
    mutationFn: (key: string) => dxApi.activateLicense(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license'] })
      setLicenseKey('')
    },
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Configure device and system settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dxLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-6 rounded bg-muted" />
                ))}
              </div>
            ) : dx ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Device ID</span>
                  <span className="font-mono">{dx.dx_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span>{dx.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span>{dx.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span>{dx.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Framework</span>
                  <span>{dx.framework}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity</span>
                  <span>{dx.capacity} streams</span>
                </div>
              </div>
            ) : (
              <p>No device information available</p>
            )}
          </CardContent>
        </Card>

        {/* License Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              License
            </CardTitle>
          </CardHeader>
          <CardContent>
            {licenseLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 rounded bg-muted" />
                ))}
              </div>
            ) : license ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize">{license.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={`flex items-center gap-1 ${
                      license.isValid ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {license.isValid ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid Until</span>
                  <span>{new Date(license.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Streams</span>
                  <span>{license.maxStreams}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Inferences</span>
                  <span>{license.maxInferences}</span>
                </div>

                {/* Activate New License */}
                <div className="mt-6 border-t pt-4">
                  <p className="mb-2 text-sm font-medium">
                    Activate New License
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter license key"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                    />
                    <Button
                      onClick={() => activateLicenseMutation.mutate(licenseKey)}
                      disabled={
                        !licenseKey || activateLicenseMutation.isPending
                      }
                    >
                      Activate
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">No license activated</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter license key"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                  />
                  <Button
                    onClick={() => activateLicenseMutation.mutate(licenseKey)}
                    disabled={!licenseKey || activateLicenseMutation.isPending}
                  >
                    Activate
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MX Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              MX
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mediamtxLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 rounded bg-muted" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Host */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Host / IP</label>
                  <Input
                    value={mxForm.host}
                    onChange={(e) =>
                      setMxForm((prev) => ({ ...prev, host: e.target.value }))
                    }
                    placeholder="localhost"
                  />
                </div>

                {/* Ports */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">API</label>
                    <Input
                      value={mxForm.apiPort}
                      onChange={(e) =>
                        setMxForm((prev) => ({ ...prev, apiPort: e.target.value }))
                      }
                      placeholder="9997"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">HLS</label>
                    <Input
                      value={mxForm.hlsPort}
                      onChange={(e) =>
                        setMxForm((prev) => ({ ...prev, hlsPort: e.target.value }))
                      }
                      placeholder="8888"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">WebRTC</label>
                    <Input
                      value={mxForm.webrtcPort}
                      onChange={(e) =>
                        setMxForm((prev) => ({ ...prev, webrtcPort: e.target.value }))
                      }
                      placeholder="8889"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">RTSP</label>
                    <Input
                      value={mxForm.rtspPort}
                      onChange={(e) =>
                        setMxForm((prev) => ({ ...prev, rtspPort: e.target.value }))
                      }
                      placeholder="8554"
                    />
                  </div>
                </div>

                {/* Enable/Disable toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="mediamtx-enabled"
                    checked={mxForm.enabled}
                    onChange={(e) =>
                      setMxForm((prev) => ({ ...prev, enabled: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="mediamtx-enabled" className="text-sm">
                    Enable MX integration
                  </label>
                </div>

                {/* Test result */}
                {testResult && (
                  <div
                    className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                      testResult.success
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {testResult.message}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleMediamtxTest}
                    disabled={testMediamtxMutation.isPending}
                  >
                    {testMediamtxMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Radio className="mr-2 h-4 w-4" />
                    )}
                    Test Connection
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleMediamtxReset}
                    disabled={resetMediamtxMutation.isPending}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                  </Button>
                  <Button
                    onClick={handleMediamtxSave}
                    disabled={updateMediamtxMutation.isPending}
                  >
                    {updateMediamtxMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save Settings
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5" />
              System Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={handleRestart}
                disabled={isRestarting}
              >
                <RefreshCw
                  className={cn('mr-2 h-4 w-4', isRestarting && 'animate-spin')}
                />
                Restart System
              </Button>
              <Button variant="destructive">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Factory Reset
              </Button>
            </div>

            {/* Restart Progress */}
            {restartSteps.length > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-medium">System Restart Progress</p>
                {restartSteps.map((step) => (
                  <div key={step.step} className="flex items-center gap-3">
                    {step.status === 'loading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {step.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {step.status === 'error' && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={cn(
                        'text-sm',
                        step.status === 'loading' && 'text-blue-600',
                        step.status === 'success' && 'text-green-600',
                        step.status === 'error' && 'text-red-600'
                      )}
                    >
                      {step.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
