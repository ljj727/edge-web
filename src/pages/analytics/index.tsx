import { useState } from 'react'
import { Card, CardContent, Button } from '@shared/ui'
import { Upload } from 'lucide-react'
import { useApps, useDeleteApp } from '@features/app'
import { AppUploadDialog } from '@widgets/app-upload-dialog'
import { AppCard } from '@widgets/app-card'

export function AnalyticsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const { data: apps, isLoading: isLoadingApps } = useApps()
  const deleteAppMutation = useDeleteApp()

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

      {/* Registered Apps */}
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
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground mt-2">No apps registered</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setIsUploadOpen(true)}
            >
              Upload App
            </Button>
          </CardContent>
        </Card>
      )}

      {/* App Upload Dialog */}
      <AppUploadDialog
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  )
}
