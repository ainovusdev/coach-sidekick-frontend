'use client'

import {
  Download,
  ExternalLink,
  FileText,
  Link2,
  UserRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useClientUploads } from '@/hooks/queries/use-resources'
import { formatDate } from '@/lib/date-utils'
import type { ClientUpload } from '@/types/resource'

function UploadRow({
  upload,
  showClient,
}: {
  upload: ClientUpload
  showClient: boolean
}) {
  const isLink = !!upload.content_url
  const href = upload.content_url || upload.file_url || undefined
  const Icon = isLink ? Link2 : FileText

  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-paper p-3">
      <div className="rounded-md bg-surface-3 p-1.5 shrink-0">
        <Icon className="h-3.5 w-3.5 text-ink-3" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{upload.title}</p>
        {upload.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-3">
            {upload.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          {showClient && upload.client_name && (
            <Badge
              variant="secondary"
              className="h-4 px-1.5 py-0 text-[10px] bg-ds-accent-bg text-ds-accent border-0"
            >
              <UserRound className="mr-0.5 h-2.5 w-2.5" />
              From {upload.client_name}
            </Badge>
          )}
          <span className="text-[11px] text-ink-4">
            {formatDate(upload.created_at)}
          </span>
        </div>
      </div>
      {href && (
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-ink-4 hover:text-ink-2 shrink-0"
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={isLink ? 'Open link' : 'Download'}
            aria-label={
              isLink ? `Open ${upload.title}` : `Download ${upload.title}`
            }
          >
            {isLink ? (
              <ExternalLink className="h-3.5 w-3.5" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
          </a>
        </Button>
      )}
    </div>
  )
}

/**
 * What a coachee shared with their coach (private uploads never arrive here).
 * Read-only for the coach. Renders nothing while loading or when empty.
 */
export function ClientUploadsList({
  clientId,
  sessionId,
  heading,
  showClient = false,
  columns = 1,
}: {
  clientId?: string
  sessionId?: string
  heading?: React.ReactNode
  showClient?: boolean
  columns?: 1 | 2
}) {
  const { data } = useClientUploads({
    client_id: clientId,
    session_id: sessionId,
  })
  const uploads = data?.resources ?? []
  if (uploads.length === 0) return null

  return (
    <div>
      {heading}
      <div
        className={
          columns === 2 ? 'grid grid-cols-1 gap-3 md:grid-cols-2' : 'space-y-2'
        }
      >
        {uploads.map(u => (
          <UploadRow key={u.id} upload={u} showClient={showClient} />
        ))}
      </div>
    </div>
  )
}
