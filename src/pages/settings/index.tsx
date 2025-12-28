import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@shared/ui'
import { Settings, Key, RefreshCw, Power, AlertTriangle, Radio, CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react'
import { dxApi } from '@features/dx'
import { useMediaMTXSettings, useUpdateMediaMTXSettings, useResetMediaMTXSettings, useTestMediaMTXConnection } from '@features/mediamtx'
import { useState, useEffect } from 'react'

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [licenseKey, setLicenseKey] = useState('')

  // MediaMTX state
  const [mediamtxForm, setMediamtxForm] = useState({
    api_url: '',
    hls_url: '',
    webrtc_url: '',
    rtsp_url: '',
    enabled: true,
  })
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // MediaMTX hooks
  const { data: mediamtxSettings, isLoading: mediamtxLoading } = useMediaMTXSettings()
  const updateMediamtxMutation = useUpdateMediaMTXSettings()
  const resetMediamtxMutation = useResetMediaMTXSettings()
  const testMediamtxMutation = useTestMediaMTXConnection()

  // Sync form with fetched settings
  useEffect(() => {
    if (mediamtxSettings) {
      setMediamtxForm({
        api_url: mediamtxSettings.api_url,
        hls_url: mediamtxSettings.hls_url,
        webrtc_url: mediamtxSettings.webrtc_url,
        rtsp_url: mediamtxSettings.rtsp_url,
        enabled: mediamtxSettings.enabled,
      })
    }
  }, [mediamtxSettings])

  const handleMediamtxSave = () => {
    updateMediamtxMutation.mutate(mediamtxForm, {
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

  const restartMutation = useMutation({
    mutationFn: dxApi.restart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dx-status'] })
    },
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

        {/* MediaMTX Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              MediaMTX Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mediamtxLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 rounded bg-muted" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">API URL</label>
                    <Input
                      value={mediamtxForm.api_url}
                      onChange={(e) =>
                        setMediamtxForm((prev) => ({ ...prev, api_url: e.target.value }))
                      }
                      placeholder="http://localhost:9997/v3"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">HLS URL</label>
                    <Input
                      value={mediamtxForm.hls_url}
                      onChange={(e) =>
                        setMediamtxForm((prev) => ({ ...prev, hls_url: e.target.value }))
                      }
                      placeholder="http://localhost:8888"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">WebRTC URL</label>
                    <Input
                      value={mediamtxForm.webrtc_url}
                      onChange={(e) =>
                        setMediamtxForm((prev) => ({ ...prev, webrtc_url: e.target.value }))
                      }
                      placeholder="http://localhost:8889"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">RTSP URL</label>
                    <Input
                      value={mediamtxForm.rtsp_url}
                      onChange={(e) =>
                        setMediamtxForm((prev) => ({ ...prev, rtsp_url: e.target.value }))
                      }
                      placeholder="rtsp://localhost:8554"
                    />
                  </div>
                </div>

                {/* Enable/Disable toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="mediamtx-enabled"
                    checked={mediamtxForm.enabled}
                    onChange={(e) =>
                      setMediamtxForm((prev) => ({ ...prev, enabled: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="mediamtx-enabled" className="text-sm">
                    Enable MediaMTX integration
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
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={() => restartMutation.mutate()}
                disabled={restartMutation.isPending}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    restartMutation.isPending ? 'animate-spin' : ''
                  }`}
                />
                Restart System
              </Button>
              <Button variant="destructive">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Factory Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
