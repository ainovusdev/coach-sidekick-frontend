'use client'

import {
  AlertCircle,
  FileSpreadsheet,
  FileText,
  File as FileIcon,
  Loader2,
  RotateCw,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { AttachmentFileType } from '@/types/agent'
import {
  formatFileSize,
  isRetryable,
  type PendingAttachment,
} from './use-agent-attachments'

const TYPE_LABEL: Record<AttachmentFileType, string> = {
  pdf: 'PDF',
  docx: 'Word',
  txt: 'Text',
  csv: 'CSV',
}

function typeFromName(name: string): AttachmentFileType | null {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase()
  return ext === 'pdf' || ext === 'docx' || ext === 'txt' || ext === 'csv'
    ? ext
    : null
}

export function attachmentTypeLabel(
  fileType: AttachmentFileType | null,
): string {
  return fileType ? TYPE_LABEL[fileType] : 'File'
}

export function AttachmentFileIcon({
  fileType,
  className,
}: {
  fileType: AttachmentFileType | null
  className?: string
}) {
  if (fileType === 'csv') return <FileSpreadsheet className={className} />
  if (fileType === 'pdf' || fileType === 'docx')
    return <FileText className={className} />
  return <FileIcon className={className} />
}

/** "Partially read" — the stored text is incomplete (scan page cap, row cap…). */
export function PartiallyReadBadge({ note }: { note?: string | null }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="shrink-0 rounded bg-amber-token-bg px-1.5 py-px text-[10px] font-medium text-amber-token outline-none focus-visible:ring-2 focus-visible:ring-ds-accent/40"
          >
            Partially read
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px] text-xs">
          {note || 'Sidekick read only the first part of this file.'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface ChipProps {
  item: PendingAttachment
  onRemove: (localId: string) => void
  onRetry: (localId: string) => void
}

/** One pending file in the composer tray. */
export function AgentAttachmentChip({ item, onRemove, onRetry }: ChipProps) {
  const fileType = item.info?.file_type ?? typeFromName(item.name)
  const isError = item.status === 'error'
  const inFlight = item.status === 'uploading' || item.status === 'reading'

  let status: string
  if (item.status === 'uploading') status = `Uploading ${item.progress}%`
  else if (item.status === 'reading')
    status = item.slow
      ? 'Scanned PDF, this can take up to a minute'
      : 'Reading…'
  else if (isError) status = item.errorMessage ?? 'Couldn’t attach this file'
  else
    status = `${attachmentTypeLabel(fileType)} · ${formatFileSize(item.size)}`

  return (
    <div
      className={cn(
        'group relative flex max-w-full items-center gap-2 rounded-lg border bg-paper py-1.5 pl-2 pr-1 text-xs shadow-sm',
        isError ? 'border-vermillion/50' : 'border-line',
      )}
      title={item.name}
    >
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
          isError
            ? 'bg-vermillion-bg text-vermillion'
            : 'bg-ds-accent-bg text-ds-accent',
        )}
      >
        {inFlight ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : isError ? (
          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <AttachmentFileIcon fileType={fileType} className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="max-w-[140px] truncate font-medium text-ink sm:max-w-[180px]">
            {item.name}
          </span>
          {item.status === 'ready' && item.info?.truncated ? (
            <PartiallyReadBadge note={item.info.truncation_note} />
          ) : null}
        </div>
        <div
          className={cn(
            'text-[11px]',
            // An error explains what to do, so it wraps rather than truncates.
            isError
              ? 'max-w-[260px] text-vermillion line-clamp-3'
              : 'max-w-[220px] truncate text-ink-3 sm:max-w-[260px]',
          )}
          title={status}
        >
          {status}
        </div>
        {item.status === 'uploading' ? (
          <div className="mt-1 h-0.5 w-full overflow-hidden rounded bg-surface-2">
            <div
              className="h-full bg-ds-accent transition-[width]"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        ) : null}
      </div>
      <div className="ml-1 flex shrink-0 items-center">
        {isError && isRetryable(item.errorCode) ? (
          <button
            type="button"
            onClick={() => onRetry(item.localId)}
            aria-label={`Retry ${item.name}`}
            title="Retry"
            className="flex h-6 w-6 items-center justify-center rounded text-ink-3 hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent/40"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onRemove(item.localId)}
          aria-label={inFlight ? `Cancel ${item.name}` : `Remove ${item.name}`}
          title={inFlight ? 'Cancel' : 'Remove'}
          className="flex h-6 w-6 items-center justify-center rounded text-ink-3 hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent/40"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
