'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BookOpen,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Link2,
} from 'lucide-react'
import {
  useClientResources,
  useClientResource,
} from '@/hooks/queries/use-client-resources'
import { useTrackResourceDownload } from '@/hooks/mutations/use-resource-mutations'
import { formatDate } from '@/lib/date-utils'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/resource'
import type { ClientResource, ResourceCategory } from '@/types/resource'

function ResourceDetailDialog({
  resourceId,
  open,
  onOpenChange,
}: {
  resourceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: resource, isLoading } = useClientResource(resourceId || '')

  if (!resource) return null

  const colors =
    CATEGORY_COLORS[resource.category as ResourceCategory] ||
    CATEGORY_COLORS.general

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg leading-tight">
            {resource.title}
          </DialogTitle>
          {resource.description && (
            <p className="text-sm text-ink-3 mt-1">{resource.description}</p>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className={`text-xs ${colors.bg} ${colors.text} border-0`}
              >
                {CATEGORY_LABELS[resource.category as ResourceCategory] ||
                  resource.category}
              </Badge>
              <span className="text-xs text-ink-4 ">
                {formatDate(resource.created_at)}
              </span>
            </div>

            {resource.content && (
              <div className="prose prose-sm max-w-none p-6 bg-paper rounded-lg">
                <div className="whitespace-pre-wrap text-ink-2 leading-relaxed">
                  {resource.content}
                </div>
              </div>
            )}

            {resource.file_url && (
              <div className="flex items-center gap-3 p-4 bg-paper rounded-lg">
                <FileText className="h-5 w-5 text-ink-3 " />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink ">
                    {resource.file_type || 'File'}
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.open(resource.file_url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            )}

            {resource.content_url && (
              <div className="flex items-center gap-3 p-4 bg-paper rounded-lg">
                <Link2 className="h-5 w-5 text-ink-3 " />
                <p className="flex-1 text-sm text-ds-accent truncate">
                  {resource.content_url}
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    window.open(
                      resource.content_url,
                      '_blank',
                      'noopener,noreferrer',
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open
                </Button>
              </div>
            )}

            {resource.tags && resource.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {resource.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ResourceRow({
  resource,
  onViewDetail,
}: {
  resource: ClientResource
  onViewDetail: (id: string) => void
}) {
  const trackDownload = useTrackResourceDownload()
  const colors =
    CATEGORY_COLORS[resource.category as ResourceCategory] ||
    CATEGORY_COLORS.general

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (resource.file_url) {
      trackDownload.mutate(resource.id)
      window.open(resource.file_url, '_blank')
    }
  }

  const handleOpenLink = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (resource.content_url) {
      trackDownload.mutate(resource.id)
      window.open(resource.content_url, '_blank', 'noopener,noreferrer')
    }
  }

  const isTextContent =
    resource.content && !resource.file_url && !resource.content_url

  return (
    <div className="flex items-center gap-3 py-2.5 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink truncate">
            {resource.title}
          </p>
          {!resource.is_viewed && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 bg-ds-accent-bg text-ds-accent font-semibold shrink-0"
            >
              NEW
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 h-4 ${colors.bg} ${colors.text}`}
          >
            {resource.category}
          </Badge>
          <span className="text-[11px] text-ink-4 ">
            {formatDate(resource.created_at)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {resource.file_url && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-ink-4 hover:text-ink-2 "
            onClick={handleDownload}
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        )}
        {resource.content_url && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-ink-4 hover:text-ink-2 "
            onClick={handleOpenLink}
            title="Open link"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}
        {isTextContent ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-ink-4 hover:text-ink-2 "
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onViewDetail(resource.id)
            }}
            title="Read"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </Button>
        ) : (
          !resource.file_url &&
          !resource.content_url && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-ink-4 hover:text-ink-2 "
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                onViewDetail(resource.id)
              }}
              title="View"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )
        )}
      </div>
    </div>
  )
}

export function RecentResourcesWidget() {
  const { data, isLoading } = useClientResources({ limit: 3 })
  const resources = data?.resources ?? []
  const [viewingResourceId, setViewingResourceId] = useState<string | null>(
    null,
  )

  return (
    <>
      <Card className="border-line">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-ink-3 " />
            Recent Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-12 bg-surface-3 rounded animate-pulse"
                />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <p className="text-sm text-ink-3 text-center py-4">
              No resources shared yet
            </p>
          ) : (
            <div className="divide-y divide-line ">
              {resources.map(resource => (
                <ResourceRow
                  key={resource.id}
                  resource={resource}
                  onViewDetail={setViewingResourceId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ResourceDetailDialog
        resourceId={viewingResourceId}
        open={!!viewingResourceId}
        onOpenChange={open => {
          if (!open) setViewingResourceId(null)
        }}
      />
    </>
  )
}
