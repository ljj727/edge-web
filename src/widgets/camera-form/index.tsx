import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Camera, Loader2 } from 'lucide-react'
import { Button, Input } from '@shared/ui'
import { cn } from '@shared/lib/cn'
import type { CameraCreate } from '@shared/types'

const cameraSchema = z.object({
  id: z
    .string()
    .min(1, 'Camera ID is required')
    .max(50, 'Camera ID must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, underscores and hyphens'),
  name: z
    .string()
    .min(1, 'Camera name is required')
    .max(100, 'Camera name must be less than 100 characters'),
  rtsp_url: z
    .string()
    .min(1, 'RTSP URL is required')
    .regex(
      /^rtsp:\/\/.+/,
      'Must be a valid RTSP URL (rtsp://...)'
    ),
})

type CameraFormData = z.infer<typeof cameraSchema>

interface CameraFormProps {
  onSubmit: (data: CameraCreate) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  className?: string
}

export function CameraForm({
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: CameraFormProps) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CameraFormData>({
    resolver: zodResolver(cameraSchema),
    defaultValues: {
      id: '',
      name: '',
      rtsp_url: '',
    },
  })

  const handleFormSubmit = async (data: CameraFormData) => {
    try {
      setError(null)
      await onSubmit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add camera')
    }
  }

  return (
    <div className={cn('bg-card rounded-lg border p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Add Camera</h2>
            <p className="text-sm text-muted-foreground">
              Register a new IP camera stream
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Camera ID */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Camera ID <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('id')}
            placeholder="cam1"
            disabled={isLoading}
          />
          {errors.id && (
            <p className="text-sm text-red-500">{errors.id.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Unique identifier for the camera (letters, numbers, underscores, hyphens)
          </p>
        </div>

        {/* Camera Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Camera Name <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('name')}
            placeholder="Front Door Camera"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* RTSP URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            RTSP URL <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('rtsp_url')}
            placeholder="rtsp://admin:password@192.168.1.100:554/stream"
            disabled={isLoading}
          />
          {errors.rtsp_url && (
            <p className="text-sm text-red-500">{errors.rtsp_url.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            RTSP stream URL from your IP camera
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 text-red-500 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Camera'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
