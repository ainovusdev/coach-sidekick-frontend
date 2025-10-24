'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { ManualSessionService } from '@/services/manual-session-service'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface MediaUploaderProps {
  sessionId: string
  onUploadComplete?: () => void
  className?: string
}

export function MediaUploader({
  sessionId,
  onUploadComplete,
  className,
}: MediaUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>('')
  const [transcriptionProgress, setTranscriptionProgress] = useState(0)

  const supportedFormats = {
    audio: ['.mp3', '.wav', '.m4a', '.ogg', '.webm'],
    video: ['.mp4', '.mov', '.avi', '.mkv'],
    documents: ['.txt', '.docx', '.pdf'],
  }

  const _allFormats = [
    ...supportedFormats.audio,
    ...supportedFormats.video,
    ...supportedFormats.documents,
  ]

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': supportedFormats.audio,
      'video/*': supportedFormats.video,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 1024 * 1024 * 1024, // 1GB for media files (documents validated separately)
    disabled: uploading,
  })

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setTranscriptionStatus('uploading')

    try {
      // Upload file
      setUploadProgress(50)
      await ManualSessionService.uploadMediaFile(sessionId, file)

      setUploadProgress(100)
      setTranscriptionStatus('processing')

      // Subscribe to transcription progress
      const unsubscribe = ManualSessionService.subscribeToTranscriptionProgress(
        sessionId,
        (status, progress) => {
          setTranscriptionStatus(status)
          setTranscriptionProgress(progress)

          if (status === 'completed') {
            toast({
              title: 'Success',
              description: 'File processed successfully!',
            })
            if (onUploadComplete) {
              onUploadComplete()
            }
          } else if (status === 'failed') {
            toast({
              title: 'Error',
              description: 'Processing failed. Please try again.',
              variant: 'destructive',
            })
          }
        },
      )

      // Cleanup subscription on unmount
      return () => unsubscribe()
    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: 'destructive',
      })
      setUploading(false)
      setTranscriptionStatus('')
    }
  }

  const removeFile = () => {
    setFile(null)
    setUploadProgress(0)
    setTranscriptionProgress(0)
    setTranscriptionStatus('')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Upload Session Content</CardTitle>
        <CardDescription>
          Upload an audio/video recording to transcribe, or upload a transcript
          document
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!file ? (
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-300 hover:border-gray-400',
              uploading && 'opacity-50 cursor-not-allowed',
            )}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-gray-900 font-medium">Drop the file here</p>
            ) : (
              <>
                <p className="text-gray-600 mb-2">
                  Drag & drop a file here, or click to select
                </p>
                <div className="mt-4 space-y-3">
                  <div className="text-sm">
                    <p className="font-semibold text-gray-700 mb-1">
                      📹 Recordings
                    </p>
                    <p className="text-gray-500">
                      Audio: {supportedFormats.audio.join(', ')}
                    </p>
                    <p className="text-gray-500">
                      Video: {supportedFormats.video.join(', ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Max 1GB</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-700 mb-1">
                      📄 Transcripts
                    </p>
                    <p className="text-gray-500">
                      {supportedFormats.documents.join(', ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    ℹ️ Transcript files are processed instantly without
                    transcription
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Preview */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <File className="w-8 h-8 text-gray-700" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              {!uploading && (
                <Button variant="ghost" size="icon" onClick={removeFile}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Uploading...</span>
                  <span className="text-gray-900 font-medium">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Processing Progress */}
            {transcriptionStatus === 'processing' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </span>
                  <span className="text-gray-900 font-medium">
                    {transcriptionProgress}%
                  </span>
                </div>
                <Progress value={transcriptionProgress} className="h-2" />
              </div>
            )}

            {/* Status Messages */}
            {transcriptionStatus === 'completed' && (
              <div className="flex items-center space-x-2 text-gray-900">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Processing complete!</span>
              </div>
            )}

            {transcriptionStatus === 'failed' && (
              <div className="flex items-center space-x-2 text-gray-900">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Processing failed</span>
              </div>
            )}

            {/* Upload Button */}
            {!uploading && transcriptionStatus !== 'completed' && (
              <Button
                onClick={handleUpload}
                disabled={!file}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload & Process
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
