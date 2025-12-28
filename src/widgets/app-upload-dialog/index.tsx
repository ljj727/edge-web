import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@shared/ui'
import { Upload, FileArchive, X, Loader2 } from 'lucide-react'
import { useUploadApp, useAppStore } from '@features/app'
import { cn } from '@shared/lib/cn'

interface AppUploadDialogProps {
  open: boolean
  onClose: () => void
}

export function AppUploadDialog({ open, onClose }: AppUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const uploadProgress = useAppStore((state) => state.uploadProgress)
  const uploadApp = useUploadApp()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
    },
    maxFiles: 1,
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      await uploadApp.mutateAsync(selectedFile)
      setSelectedFile(null)
      onClose()
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleClose = () => {
    if (!uploadApp.isPending) {
      setSelectedFile(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Vision App</DialogTitle>
          <DialogDescription>
            Upload a zip file containing your Vision App
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50',
              uploadApp.isPending && 'pointer-events-none opacity-50'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-primary">Drop the file here...</p>
            ) : (
              <div>
                <p className="font-medium">Drag & drop a zip file here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to select
                </p>
              </div>
            )}
          </div>

          {/* Selected file */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <FileArchive className="h-8 w-8 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!uploadApp.isPending && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Upload progress */}
          {uploadApp.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {uploadApp.isError && (
            <p className="text-sm text-destructive">
              Upload failed. Please try again.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploadApp.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadApp.isPending}
          >
            {uploadApp.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
