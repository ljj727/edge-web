import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@shared/ui'
import {
  Settings, RefreshCw, Power, AlertTriangle, Brain,
  CheckCircle, XCircle, Loader2, Trash2, Plus
} from 'lucide-react'
import { useApps, useUploadApp, useDeleteApp } from '@features/app'
import { useSystemRestart, type RestartStep } from '@features/system'
import { useState } from 'react'
import { cn } from '@shared/lib/cn'

export function SettingsPage() {
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

  // Vision Apps
  const { data: apps, isLoading: appsLoading } = useApps()
  const uploadApp = useUploadApp()
  const deleteApp = useDeleteApp()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadApp.mutate(file)
      e.target.value = ''
    }
  }

  const handleDeleteApp = (id: string) => {
    deleteApp.mutate(id)
  }

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage system settings and vision apps
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5" />
              System Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={handleRestart} disabled={isRestarting}>
                <RefreshCw className={cn('mr-2 h-4 w-4', isRestarting && 'animate-spin')} />
                Restart System
              </Button>
              <Button variant="destructive">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Factory Reset
              </Button>
            </div>
            {restartSteps.length > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-medium">System Restart Progress</p>
                {restartSteps.map((step) => (
                  <div key={step.step} className="flex items-center gap-3">
                    {step.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    {step.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {step.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
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

        {/* Vision Apps */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Vision Apps
              </CardTitle>
              <Button onClick={handleUploadClick} disabled={uploadApp.isPending}>
                {uploadApp.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Upload App
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </CardHeader>
          <CardContent>
            {appsLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 rounded bg-muted" />
                ))}
              </div>
            ) : apps && apps.length > 0 ? (
              <div className="space-y-2">
                {apps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{app.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.id}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteApp(app.id)}
                      disabled={deleteApp.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mb-2" />
                <p>No vision apps installed</p>
                <p className="text-sm">Upload a .zip file to add a vision app</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
