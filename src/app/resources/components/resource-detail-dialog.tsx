'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  FileText,
  Video,
  Link2,
  Pencil,
  Trash2,
  Eye,
  Download,
  Globe,
  User,
  Share2,
  ClipboardList,
  Dumbbell,
  FileEdit,
  Newspaper,
  ExternalLink,
  Calendar,
  Tag,
  X,
  Loader2,
} from 'lucide-react'
import type { SharedResource, SharingScope } from '@/types/resource'
import { formatDate } from '@/lib/date-utils'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/resource'
import { useUnshareResource } from '@/hooks/mutations/use-resource-mutations'

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  general: FileText,
  document: FileText,
  worksheet: ClipboardList,
  exercise: Dumbbell,
  article: Newspaper,
  template: FileEdit,
  video: Video,
  link: Link2,
}

const SCOPE_ICONS: Record<SharingScope, typeof Globe> = {
  global: Globe,
  personal: User,
  session: Calendar,
}

const SCOPE_LABELS: Record<SharingScope, string> = {
  global: 'Global (Admin)',
  personal: 'Personal',
  session: 'Session',
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface ResourceDetailDialogProps {
  resource: SharedResource | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (r: SharedResource) => void
  onDelete: (r: SharedResource) => void
  onShare?: (r: SharedResource) => void
  isOwner?: boolean
}

export function ResourceDetailDialog({
  resource,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onShare,
  isOwner = true,
}: ResourceDetailDialogProps) {
  const unshareResource = useUnshareResource()

  if (!resource) return null

  const Icon = CATEGORY_ICONS[resource.category] || FileText
  const ScopeIcon = SCOPE_ICONS[resource.sharing_scope] || Globe
  const colors = CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.general

  const canShare = isOwner && onShare

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg ${colors.bg} shrink-0`}>
              <Icon className={`h-5 w-5 ${colors.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl leading-tight text-left">
                {resource.title}
              </SheetTitle>
              {resource.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {resource.description}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 pt-2">
          {/* Metadata badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={`text-xs ${colors.bg} ${colors.text} border-0`}
            >
              {CATEGORY_LABELS[resource.category] || resource.category}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <ScopeIcon className="h-3 w-3" />
              {SCOPE_LABELS[resource.sharing_scope]}
            </Badge>
            {resource.file_size && (
              <Badge variant="outline" className="text-xs">
                {formatFileSize(resource.file_size)}
              </Badge>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 py-3 border-y border-gray-100 dark:border-gray-700">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {resource.view_count} views
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="h-4 w-4" />
              {resource.download_count} downloads
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(resource.created_at)}
            </span>
          </div>

          {/* Content preview */}
          {resource.content && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Content
              </h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {resource.content}
              </div>
            </div>
          )}

          {/* File details */}
          {resource.file_url && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                File
              </h4>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {resource.file_type || 'File'}
                  </p>
                  {resource.file_size && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(resource.file_size)}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(resource.file_url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          )}

          {/* Link details */}
          {resource.content_url && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Link
              </h4>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Link2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <p className="flex-1 text-sm text-blue-600 truncate">
                  {resource.content_url}
                </p>
                <Button
                  variant="outline"
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
            </div>
          )}

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Tag className="h-4 w-4" />
                Tags
              </h4>
              <div className="flex gap-1.5 flex-wrap">
                {resource.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Shares */}
          {resource.shares && resource.shares.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Share2 className="h-4 w-4" />
                Shared with ({resource.shares.length})
              </h4>
              <div className="space-y-1.5">
                {resource.shares.map(share => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {share.shared_with_name || 'Client'}
                    </span>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={() =>
                          unshareResource.mutate({
                            resourceId: resource.id,
                            shareId: share.id,
                          })
                        }
                        disabled={unshareResource.isPending}
                      >
                        {unshareResource.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scope details */}
          {(resource.client_id || resource.session_id) && (
            <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
              {resource.client_id && <p>Client ID: {resource.client_id}</p>}
              {resource.session_id && <p>Session ID: {resource.session_id}</p>}
            </div>
          )}

          {/* Action buttons */}
          {isOwner && (
            <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
              {canShare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false)
                    onShare(resource)
                  }}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  onEdit(resource)
                }}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                onClick={() => {
                  onOpenChange(false)
                  onDelete(resource)
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
