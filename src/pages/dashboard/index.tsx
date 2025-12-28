import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui'
import { Activity, Cpu, HardDrive, Video, Brain, PlayCircle, StopCircle, AlertCircle } from 'lucide-react'
import { metricsApi } from '@features/metrics'
import { useInferences, useInferenceStatuses } from '@features/inference'
import { useCameras } from '@features/camera'
import { useApps } from '@features/app'
import { cn } from '@shared/lib/cn'
import { getInferenceStatusType, type InferenceStatusType } from '@shared/types'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const statusConfig: Record<InferenceStatusType, { label: string; color: string; icon: typeof PlayCircle }> = {
  running: { label: 'Running', color: 'text-green-600 bg-green-50 border-green-200', icon: PlayCircle },
  stopped: { label: 'Stopped', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: StopCircle },
  error: { label: 'Error', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertCircle },
}

export function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: metricsApi.getCurrent,
    refetchInterval: 5000,
  })

  const { data: inferences, isLoading: inferencesLoading } = useInferences()
  const { data: statuses } = useInferenceStatuses()
  const { data: cameras } = useCameras()
  const { data: apps } = useApps()

  // Create status map for quick lookup (convert backend int codes to frontend status types)
  const statusMap = new Map<string, InferenceStatusType>()
  statuses?.forEach((s) => {
    statusMap.set(`${s.appId}-${s.videoId}`, getInferenceStatusType(s))
  })

  // Count running inferences (status=3 means CONNECTED/running)
  const runningCount = statuses?.filter((s) => s.status === 3).length ?? 0

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and inference status
        </p>
      </div>

      {/* System Metrics */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">System</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="CPU Usage"
            value={metrics?.cpuPercent ?? 0}
            unit="%"
            icon={Cpu}
            loading={metricsLoading}
          />
          <MetricCard
            title="Memory Usage"
            value={metrics?.memoryPercent ?? 0}
            unit="%"
            icon={Activity}
            loading={metricsLoading}
            subtitle={metrics ? `${formatBytes(metrics.memoryUsed)} / ${formatBytes(metrics.memoryTotal)}` : undefined}
          />
          <MetricCard
            title="Disk Usage"
            value={metrics?.diskPercent ?? 0}
            unit="%"
            icon={HardDrive}
            loading={metricsLoading}
            subtitle={metrics ? `${formatBytes(metrics.diskUsed)} / ${formatBytes(metrics.diskTotal)}` : undefined}
          />
        </div>
      </div>

      {/* Resources */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Resources</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cameras</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cameras?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground">registered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vision Apps</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apps?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground">registered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inferences</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className="text-green-600">{runningCount}</span>
                <span className="text-muted-foreground text-lg"> / {inferences?.length ?? 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">running / total</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Inference Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Inference Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inferencesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : inferences?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Camera</th>
                    <th className="text-left py-3 px-4 font-medium">App</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inferences.map((inference) => {
                    const status = statusMap.get(`${inference.appId}-${inference.videoId}`) ?? 'stopped'
                    const config = statusConfig[status]
                    const StatusIcon = config.icon
                    const camera = cameras?.find((c) => c.id === inference.videoId)

                    return (
                      <tr key={`${inference.appId}-${inference.videoId}`} className="border-b last:border-0">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-muted-foreground" />
                            <span>{camera?.name ?? inference.videoId}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{inference.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{inference.type}</td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                              config.color
                            )}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {config.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No inferences configured</p>
              <p className="text-sm">Go to Video Stream to connect apps to cameras</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: number
  unit: string
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
  subtitle?: string
}

function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  loading,
  subtitle,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        ) : (
          <>
            <div className="text-2xl font-bold">
              {value.toFixed(1)}
              {unit && <span className="ml-1 text-sm font-normal">{unit}</span>}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
