'use client'

/**
 * Shared UI for note file attachments: display strip, pending-upload queue,
 * and client-side validation matching the backend allowlist.
 */

import { File, FileText, Image as ImageIcon, X } from 'lucide-react'
import { NoteAttachment } from '@/types/session-note'

export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024 // 25MB, matches backend
export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.pdf',
  '.docx',
  '.txt',
]
export const ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_EXTENSIONS.join(',')

export function validateAttachment(file: File): string | null {
  const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`
  if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension)) {
    return `${file.name}: unsupported file type. Allowed: png, jpg, gif, webp, pdf, docx, txt.`
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return `${file.name}: file too large. Maximum size is 25MB.`
  }
  return null
}

export function getFileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return ImageIcon
  if (contentType === 'application/pdf') return FileText
  return File
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function NoteAttachmentsStrip({
  attachments,
  canDelete = false,
  onDelete,
}: {
  attachments: NoteAttachment[]
  canDelete?: boolean
  onDelete?: (attachment: NoteAttachment) => void
}) {
  if (!attachments.length) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map(att => {
        const isImage = att.content_type.startsWith('image/')
        const Icon = getFileIcon(att.content_type)

        return (
          <div key={att.id} className="relative group">
            {isImage ? (
              // Presigned URLs are re-signed on every notes fetch, so no
              // staleness check is needed before opening.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={att.file_url}
                alt={att.filename}
                title={att.filename}
                className="h-16 w-16 object-cover rounded-lg border cursor-pointer"
                onClick={() => window.open(att.file_url, '_blank')}
              />
            ) : (
              <button
                type="button"
                onClick={() => window.open(att.file_url, '_blank')}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-muted/50 hover:bg-muted text-left"
                title={att.filename}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-xs max-w-[140px] truncate">
                  {att.filename}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatFileSize(att.file_size)}
                </span>
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(att)}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground items-center justify-center hidden group-hover:flex"
                title="Remove attachment"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function PendingFilesList({
  files,
  onRemove,
}: {
  files: File[]
  onRemove: (index: number) => void
}) {
  if (!files.length) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((file, index) => {
        const Icon = getFileIcon(file.type)
        return (
          <div
            key={`${file.name}-${index}`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-muted/50"
          >
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-xs max-w-[140px] truncate">{file.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatFileSize(file.size)}
            </span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-muted-foreground hover:text-foreground"
              title="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
