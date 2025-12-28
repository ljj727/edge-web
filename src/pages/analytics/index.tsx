import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@shared/ui'
import { Brain, Settings, Play, Square, Trash2, Upload } from 'lucide-react'
import { useInferences, useStartStream, useStopStream } from '@features/inference'
import { useApps, useDeleteApp } from '@features/app'
import { InferenceSettingDialog } from '@widgets/inference-editor'
import { AppUploadDialog } from '@widgets/app-upload-dialog'
import { AppCard } from '@widgets/app-card'

export function AnalyticsPage() {
  const [selectedInference, setSelectedInference] = useState<string | null>(null)
  const [isSettingOpen, setIsSettingOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const { data: inferences, isLoading: isLoadingInferences } = useInferences()
  const { data: apps, isLoading: isLoadingApps } = useApps()
  const startStreamMutation = useStartStream()
  const stopStreamMutation = useStopStream()
  const deleteAppMutation = useDeleteApp()

  // Track active stream sessions
  const [streamSessions, setStreamSessions] = useState<Record<string, string>>({})

  const handleStart = async (appId: string, videoId: string, uri: string) => {
    const result = await startStreamMutation.mutateAsync({ appId, videoId, uri })
    // Store session_id for stopping later
    setStreamSessions(prev => ({ ...prev, [`${appId}-${videoId}`]: result.session_id }))
  }

  const handleStop = (appId: string, videoId: string) => {
    const sessionId = streamSessions[`${appId}-${videoId}`]
    if (sessionId) {
      stopStreamMutation.mutate(sessionId)
      setStreamSessions(prev => {
        const next = { ...prev }
        delete next[`${appId}-${videoId}`]
        return next
      })
    }
  }

  const handleOpenSettings = (appId: string) => {
    setSelectedInference(appId)
    setIsSettingOpen(true)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vision Apps</h1>
          <p className="text-muted-foreground">
            Manage inference pipelines and analytics
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Vision App
        </Button>
      </div>

      {/* Registered Apps Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Registered Apps</h2>
        {isLoadingApps ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="px-4 py-3 border-b">
                  <div className="h-5 w-32 rounded bg-muted" />
                </div>
                <div className="aspect-video bg-muted" />
                <div className="p-4">
                  <div className="h-4 w-full rounded bg-muted mb-2" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                </div>
              </Card>
            ))}
          </div>
        ) : apps?.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onDelete={(id) => deleteAppMutation.mutate(id)}
                isDeleting={deleteAppMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground mt-2">No apps registered</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setIsUploadOpen(true)}
              >
                Upload App
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Inference Pipelines Section */}
      <h2 className="text-xl font-semibold mb-4">Inference Pipelines</h2>
      {isLoadingInferences ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-32 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : inferences?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inferences.map((inference) => (
            <Card key={inference.appId} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {inference.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span>{inference.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Video</span>
                    <span className="truncate max-w-[150px]">
                      {inference.videoId}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Events</span>
                    <span>{inference.settings.configs.length}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStart(inference.appId, inference.videoId, inference.uri)}
                    disabled={startStreamMutation.isPending}
                  >
                    <Play className="mr-1 h-4 w-4" />
                    Start
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStop(inference.appId, inference.videoId)}
                    disabled={stopStreamMutation.isPending}
                  >
                    <Square className="mr-1 h-4 w-4" />
                    Stop
                  </Button>
                </div>

                <div className="mt-2 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenSettings(inference.appId)}
                  >
                    <Settings className="mr-1 h-4 w-4" />
                    Settings
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground mt-2">No inference pipelines configured</p>
          </CardContent>
        </Card>
      )}

      {/* Inference Setting Dialog */}
      {isSettingOpen && selectedInference && (
        <InferenceSettingDialog
          appId={selectedInference}
          open={isSettingOpen}
          onClose={() => setIsSettingOpen(false)}
        />
      )}

      {/* App Upload Dialog */}
      <AppUploadDialog
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  )
}
