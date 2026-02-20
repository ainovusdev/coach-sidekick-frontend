'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  ArrowRight,
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
            <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
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
              <span className="text-xs text-gray-400">
                {new Date(resource.created_at).toLocaleDateString()}
              </span>
            </div>

            {resource.content && (
              <div className="prose prose-sm max-w-none p-6 bg-gray-50 rounded-lg">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {resource.content}
                </div>
              </div>
            )}

            {resource.file_url && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
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
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Link2 className="h-5 w-5 text-gray-500" />
                <p className="flex-1 text-sm text-blue-600 truncate">
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
          <p className="text-sm font-medium text-gray-900 truncate">
            {resource.title}
          </p>
          {!resource.is_viewed && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 font-semibold shrink-0"
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
          <span className="text-[11px] text-gray-400">
            {new Date(resource.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {resource.file_url && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
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
            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
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
            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
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
              className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
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
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-600" />
              Recent Resources
            </CardTitle>
            <Link href="/client-portal/resources">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                Browse All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No resources shared yet
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
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
