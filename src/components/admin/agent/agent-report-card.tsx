'use client'

import { Download, FileText } from 'lucide-react'
import type { ReportSpec } from '@/types/agent'

interface Props {
  spec: ReportSpec
}

export function AgentReportCard({ spec }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-line-strong bg-paper p-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ds-accent-bg text-ds-accent">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">
          {spec.title}
        </div>
        <div className="truncate text-xs text-ink-3">
          {spec.filename} · {spec.page_count} page
          {spec.page_count === 1 ? '' : 's'} · {formatBytes(spec.size_bytes)}
        </div>
      </div>
      <a
        href={spec.url}
        download={spec.filename}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-ds-accent-bg hover:text-ds-accent"
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </a>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
