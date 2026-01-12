import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Camera, Loader2, Plus } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { CameraCreate } from '@shared/types'

const cameraSchema = z.object({
  id: z
    .string()
    .min(1, 'ID를 입력하세요')
    .max(50, 'ID는 50자 이하로 입력하세요')
    .regex(/^[a-zA-Z0-9_-]+$/, '영문, 숫자, _, - 만 사용 가능'),
  name: z
    .string()
    .min(1, '이름을 입력하세요')
    .max(100, '이름은 100자 이하로 입력하세요'),
  rtsp_url: z
    .string()
    .min(1, 'RTSP URL을 입력하세요')
    .regex(/^rtsp:\/\/.+/, 'rtsp:// 로 시작해야 합니다'),
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
      setError(err instanceof Error ? err.message : '카메라 등록 실패')
    }
  }

  return (
    <div className={cn('bg-gray-900 rounded-xl border border-gray-800 p-5', className)}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-800 rounded-lg">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">카메라 등록</h2>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Camera ID */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">
            카메라 ID <span className="text-red-400">*</span>
          </label>
          <input
            {...register('id')}
            placeholder="cam1"
            disabled={isLoading}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-50"
          />
          {errors.id && (
            <p className="text-xs text-red-400">{errors.id.message}</p>
          )}
        </div>

        {/* Camera Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">
            이름 <span className="text-red-400">*</span>
          </label>
          <input
            {...register('name')}
            placeholder="현관 카메라"
            disabled={isLoading}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-50"
          />
          {errors.name && (
            <p className="text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* RTSP URL */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">
            RTSP URL <span className="text-red-400">*</span>
          </label>
          <input
            {...register('rtsp_url')}
            placeholder="rtsp://admin:password@192.168.1.100:554/stream"
            disabled={isLoading}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-50"
          />
          {errors.rtsp_url && (
            <p className="text-xs text-red-400">{errors.rtsp_url.message}</p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white font-medium transition-all disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-white hover:bg-gray-100 rounded-lg text-gray-900 font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                등록 중...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                등록
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
