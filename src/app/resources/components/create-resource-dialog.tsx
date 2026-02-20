'use client'

import { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload, File, Link2, FileText, X, RefreshCw } from 'lucide-react'
import type { ResourceCategory } from '@/types/resource'
import type { ResourceFormState } from '../hooks/use-resource-form'

// File extension to category mapping
const FILE_CATEGORY_MAP: Record<string, ResourceCategory> = {
  pdf: 'document',
  doc: 'document',
  docx: 'document',
  txt: 'document',
  rtf: 'document',
  xls: 'worksheet',
  xlsx: 'worksheet',
  csv: 'worksheet',
  mp4: 'video',
  mov: 'video',
  avi: 'video',
  webm: 'video',
  mkv: 'video',
  png: 'template',
  jpg: 'template',
  jpeg: 'template',
  gif: 'template',
  svg: 'template',
  ppt: 'template',
  pptx: 'template',
}

function getAutoCategory(fileName: string): ResourceCategory {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (!ext) return 'general'
  return FILE_CATEGORY_MAP[ext] || 'general'
}

function titleFromFilename(fileName: string): string {
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, '')
  return nameWithoutExt.replace(/[-_]/g, ' ')
}

function isUrl(text: string): boolean {
  return /^https?:\/\/\S+$/.test(text.trim())
}

interface CreateResourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: ResourceFormState
  setField: <K extends keyof ResourceFormState>(
    key: K,
    value: ResourceFormState[K],
  ) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onSubmit: () => Promise<void>
  isPending: boolean
  uploadProgress?: number | null
  presetClientId?: string
}

export function CreateResourceDialog({
  open,
  onOpenChange,
  form,
  setField,
  fileInputRef,
  onSubmit,
  isPending,
  uploadProgress,
  presetClientId,
}: CreateResourceDialogProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [textareaContent, setTextareaContent] = useState('')
  const [autoFilledTitle, setAutoFilledTitle] = useState<string | null>(null)

  // Reset local state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTextareaContent('')
      setAutoFilledTitle(null)
      setIsDragging(false)
    }
  }, [open])

  // Pre-set client scope if presetClientId is provided
  useEffect(() => {
    if (presetClientId && open) {
      setField('scope', 'client')
      setField('clientId', presetClientId)
    }
  }, [presetClientId, open, setField])

  // Derive detected type from current state
  const detectedType: 'file' | 'link' | 'text' = form.selectedFile
    ? 'file'
    : isUrl(textareaContent)
      ? 'link'
      : 'text'

  // Sync form fields from local state on changes
  useEffect(() => {
    if (form.selectedFile) {
      setField('type', 'file')
    } else if (isUrl(textareaContent)) {
      setField('type', 'link')
      setField('contentUrl', textareaContent.trim())
      setField('content', '')
      setField('category', 'link')
    } else {
      setField('type', 'text')
      setField('content', textareaContent)
      setField('contentUrl', '')
      if (!form.selectedFile) {
        setField('category', 'general')
      }
    }
  }, [textareaContent, form.selectedFile, setField])

  const applyFile = useCallback(
    (file: File) => {
      setField('selectedFile', file)
      const autoCategory = getAutoCategory(file.name)
      setField('category', autoCategory)
      setField('type', 'file')

      // Auto-fill title if empty or was previously auto-filled
      const autoTitle = titleFromFilename(file.name)
      if (!form.title.trim() || form.title === autoFilledTitle) {
        setField('title', autoTitle)
        setAutoFilledTitle(autoTitle)
      }
    },
    [setField, form.title, autoFilledTitle],
  )

  const removeFile = useCallback(() => {
    setField('selectedFile', null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    // Clear title if it was auto-filled from the file
    if (autoFilledTitle && form.title === autoFilledTitle) {
      setField('title', '')
    }
    setAutoFilledTitle(null)
  }, [setField, fileInputRef, autoFilledTitle, form.title])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) applyFile(file)
    },
    [applyFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const hasContent = form.selectedFile || textareaContent.trim().length > 0
  const canSubmit = form.title.trim() && hasContent && !isPending

  const typeLabel =
    detectedType === 'file' ? 'file' : detectedType === 'link' ? 'link' : 'text'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <DialogDescription>
            Paste a URL, drop a file, or type content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="resource-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="resource-title"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder="Resource title"
              maxLength={255}
            />
          </div>

          {/* Unified content area */}
          <div className="space-y-2">
            <Label>Content</Label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative rounded-lg border-2 transition-colors ${
                isDragging ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
              }`}
            >
              {/* Drag overlay */}
              {isDragging && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-50/90 border-2 border-dashed border-gray-400">
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">
                      Drop your file here
                    </p>
                  </div>
                </div>
              )}

              {form.selectedFile ? (
                /* File selected view */
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-shrink-0">
                    <File className="h-8 w-8 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {form.selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(form.selectedFile.size)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                      title="Replace file"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* Text/URL input view */
                <div className="relative">
                  <Textarea
                    value={textareaContent}
                    onChange={e => setTextareaContent(e.target.value)}
                    placeholder="Paste a URL or type your content..."
                    rows={5}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                  />
                  <div className="flex justify-end px-3 pb-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-gray-400 hover:text-gray-600 gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Browse files
                    </Button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) applyFile(file)
                }}
              />
            </div>

            {/* Type indicator */}
            {hasContent && (
              <div className="flex items-center justify-end gap-1.5 text-xs text-gray-400">
                {detectedType === 'file' && <File className="h-3 w-3" />}
                {detectedType === 'link' && <Link2 className="h-3 w-3" />}
                {detectedType === 'text' && <FileText className="h-3 w-3" />}
                <span>Will be saved as {typeLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Upload progress bar */}
        {uploadProgress !== null && uploadProgress !== undefined && (
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Uploading file...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gray-900 transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="bg-gray-900 hover:bg-gray-800"
          >
            {uploadProgress !== null && uploadProgress !== undefined
              ? `Uploading ${uploadProgress}%`
              : isPending
                ? 'Creating...'
                : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
