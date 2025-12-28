import { useState } from 'react'
import { Card, CardContent, Button } from '@shared/ui'
import { X, MoreVertical } from 'lucide-react'
import { appApi } from '@features/app'
import type { App } from '@shared/types'

interface AppCardProps {
  app: App
  onDelete: (id: string) => void
  isDeleting?: boolean
}

export function AppCard({ app, onDelete, isDeleting }: AppCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const coverUrl = appApi.getCoverUrl(app.id)

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="font-medium">{app.name}</span>
          <button
            onClick={() => onDelete(app.id)}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-background border rounded-md shadow-lg z-10 py-1 min-w-[120px]">
              <button
                className="w-full px-3 py-2 text-sm text-left text-destructive hover:bg-muted"
                onClick={() => {
                  onDelete(app.id)
                  setShowMenu(false)
                }}
                disabled={isDeleting}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-0">
        {!isExpanded ? (
          // Collapsed view - Cover image and description
          <div
            className="cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            {/* Cover Image */}
            {!imageError ? (
              <div className="aspect-video bg-muted">
                <img
                  src={coverUrl}
                  alt={app.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <span className="text-white/50 text-sm">No preview</span>
              </div>
            )}

            {/* Description */}
            <div className="p-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {app.desc || 'No description'}
              </p>
            </div>
          </div>
        ) : (
          // Expanded view - Details
          <div
            className="p-4 cursor-pointer min-h-[200px]"
            onClick={() => setIsExpanded(false)}
          >
            <div className="space-y-2 text-sm mb-4">
              <div>
                <span className="text-muted-foreground">UUID : </span>
                <span className="font-mono text-xs">{app.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Name : </span>
                <span>{app.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Version : </span>
                <span>{app.version}</span>
              </div>
            </div>

            {/* Models Table */}
            {app.models.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {app.models.map((model) => (
                      <tr key={model.id} className="border-b last:border-b-0">
                        <td className="px-4 py-2">{model.name}</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">
                          {model.version}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
