import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui'
import { Activity, Cpu, HardDrive } from 'lucide-react'
import { metricsApi } from '@features/metrics'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: metricsApi.getCurrent,
    refetchInterval: 5000,
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and performance metrics
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
