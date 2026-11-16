'use client'

import type { AttachmentBlock } from '@/types/agent'
import {
  AttachmentFileIcon,
  PartiallyReadBadge,
  attachmentTypeLabel,
} from './agent-attachment-chip'
import { formatFileSize } from './use-agent-attachments'

/** A sent attachment, shown above the coach's message bubble. Not clickable in v1. */
export function AgentAttachmentCard({ block }: { block: AttachmentBlock }) {
  return (
    <div
      className="flex w-[260px] max-w-full items-center gap-2.5 rounded-lg border border-line-strong bg-paper p-2 shadow-sm"
      title={block.filename}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ds-accent-bg text-ds-accent">
        <AttachmentFileIcon fileType={block.file_type} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">
          {block.filename}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-ink-3">
          <span className="truncate">
            {attachmentTypeLabel(block.file_type)} ·{' '}
            {formatFileSize(block.size_bytes)}
          </span>
          {block.truncated ? (
            <PartiallyReadBadge note={block.truncation_note} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
