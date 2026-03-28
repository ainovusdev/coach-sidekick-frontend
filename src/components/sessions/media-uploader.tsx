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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Upload, File, X, FileUp, ClipboardPaste, Clock } from 'lucide-react'
import { ManualSessionService } from '@/services/manual-session-service'
import { useOptionalProcessing } from '@/contexts/processing-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function estimateProcessingTime(file: File): string {
  const sizeMB = file.size / (1024 * 1024)
  const ext = file.name.split('.').pop()?.toLowerCase() || ''

  const docExts = ['txt', 'docx', 'pdf', 'vtt']
  const audioExts = ['mp3', 'wav', 'm4a', 'ogg', 'webm']
  const videoExts = ['mp4', 'mov', 'avi', 'mkv']

  if (docExts.includes(ext)) {
    return sizeMB < 1 ? '~15-30 sec' : '~30-60 sec'
  }
  if (audioExts.includes(ext)) {
    if (sizeMB < 10) return '~1-3 min'
    if (sizeMB < 50) return '~3-5 min'
    return '~5-10 min'
  }
  if (videoExts.includes(ext)) {
    if (sizeMB < 50) return '~2-5 min'
    if (sizeMB < 200) return '~5-10 min'
    return '~10-20 min'
  }
  return '~1-3 min'
}

function estimateTextProcessingTime(textLength: number): string {
  if (textLength < 5000) return '~15 sec'
  if (textLength < 50000) return '~15-30 sec'
  return '~30-60 sec'
}

interface MediaUploaderProps {
  sessionId: string
  sessionTitle?: string
  onUploadComplete?: () => void
  className?: string
}

export function MediaUploader({
  sessionId,
  sessionTitle,
  onUploadComplete,
  className,
}: MediaUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<string>('upload')
  const [pastedText, setPastedText] = useState('')
  const [submittingText, setSubmittingText] = useState(false)
  const processing = useOptionalProcessing()

  const isProcessing = uploading || submittingText

  const supportedFormats = {
    audio: ['.mp3', '.wav', '.m4a', '.ogg', '.webm'],
    video: ['.mp4', '.mov', '.avi', '.mkv'],
    documents: ['.txt', '.docx', '.pdf', '.vtt'],
  }

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
      'text/vtt': ['.vtt'],
    },
    maxFiles: 1,
    maxSize: 1024 * 1024 * 1024, // 1GB
    disabled: isProcessing,
  })

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      setUploadProgress(50)
      await ManualSessionService.uploadMediaFile(sessionId, file)
      setUploadProgress(100)

      // Register with global processing tracker
      processing?.addProcessingSession(sessionId, sessionTitle || file.name)

      toast.success('Upload started', {
        description: 'Processing in the background — you can navigate away.',
      })

      // Signal completion immediately (non-blocking)
      onUploadComplete?.()
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
      setUploading(false)
    }
  }

  const handlePasteSubmit = async () => {
    if (pastedText.length < 50) return

    setSubmittingText(true)

    try {
      await ManualSessionService.submitPastedText(sessionId, pastedText)

      // Register with global processing tracker
      processing?.addProcessingSession(
        sessionId,
        sessionTitle || 'Pasted transcript',
      )

      toast.success('Text submitted', {
        description: 'Processing in the background — you can navigate away.',
      })

      // Signal completion immediately (non-blocking)
      onUploadComplete?.()
    } catch (error) {
      console.error('Paste submit failed:', error)
      toast.error(error instanceof Error ? error.message : 'Processing failed')
      setSubmittingText(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setUploadProgress(0)
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
          Upload a file or paste transcript text
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger
              value="upload"
              className="flex-1"
              disabled={isProcessing}
            >
              <FileUp className="w-4 h-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger
              value="paste"
              className="flex-1"
              disabled={isProcessing}
            >
              <ClipboardPaste className="w-4 h-4 mr-2" />
              Paste Text
            </TabsTrigger>
          </TabsList>

          {/* Upload File Tab */}
          <TabsContent value="upload" className="mt-4">
            {!file ? (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400',
                  isProcessing && 'opacity-50 cursor-not-allowed',
                )}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-gray-900 font-medium">
                    Drop the file here
                  </p>
                ) : (
                  <>
                    <p className="text-gray-600 mb-2">
                      Drag & drop a file here, or click to select
                    </p>
                    <p className="text-sm text-gray-400">
                      Audio ({supportedFormats.audio.join(', ')}), Video (
                      {supportedFormats.video.join(', ')}), Documents (
                      {supportedFormats.documents.join(', ')})
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Max 1GB for media, 10MB for documents
                    </p>
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
                  {!isProcessing && (
                    <Button variant="ghost" size="icon" onClick={removeFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Upload progress (HTTP upload only) */}
                {uploading && (
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

                {/* Time estimate + upload button (before upload) */}
                {!isProcessing && (
                  <>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Estimated processing time:{' '}
                        {estimateProcessingTime(file)}
                      </span>
                    </div>

                    <Button
                      onClick={handleUpload}
                      disabled={!file}
                      className="w-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Process
                    </Button>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* Paste Text Tab */}
          <TabsContent value="paste" className="mt-4">
            <div className="space-y-4">
              <Textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder={`Paste your transcript text here...\n\nAny transcript format is supported, for example:\n\n[00:01:23] Speaker Name:\nText of what was said...\n\nOr:\nCoach: How have you been?\nClient: Things have been going well...`}
                className="resize-y min-h-[200px] font-mono text-sm"
                rows={12}
                disabled={isProcessing}
              />

              {/* Character count + time estimate */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {pastedText.length.toLocaleString()} chars
                  {pastedText.length > 0 && pastedText.length < 50 && (
                    <span className="text-amber-600 ml-2">
                      (minimum 50 characters)
                    </span>
                  )}
                </span>
                {pastedText.length >= 50 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Est. {estimateTextProcessingTime(pastedText.length)}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              {!isProcessing && (
                <Button
                  onClick={handlePasteSubmit}
                  disabled={pastedText.length < 50}
                  className="w-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900"
                >
                  <ClipboardPaste className="w-4 h-4 mr-2" />
                  Process Text
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
