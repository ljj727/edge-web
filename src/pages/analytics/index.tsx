import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@shared/ui'
import { Plus, Brain, Settings, Play, Square, Trash2 } from 'lucide-react'
import { useInferences, useStartInference, useStopInference } from '@features/inference'
import { InferenceSettingDialog } from '@widgets/inference-editor'

export function AnalyticsPage() {
  const [selectedInference, setSelectedInference] = useState<string | null>(null)
  const [isSettingOpen, setIsSettingOpen] = useState(false)

  const { data: inferences, isLoading } = useInferences()
  const startMutation = useStartInference()
  const stopMutation = useStopInference()

  const handleStart = (appId: string, videoId: string) => {
    startMutation.mutate({ appId, videoId })
  }

  const handleStop = (appId: string, videoId: string) => {
    stopMutation.mutate({ appId, videoId })
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Vision App
        </Button>
      </div>

      {isLoading ? (
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
                    onClick={() => handleStart(inference.appId, inference.videoId)}
                  >
                    <Play className="mr-1 h-4 w-4" />
                    Start
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStop(inference.appId, inference.videoId)}
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
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No Vision Apps</h2>
            <p className="text-muted-foreground">
              Create a new vision app to get started
            </p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Vision App
            </Button>
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
    </div>
  )
}
