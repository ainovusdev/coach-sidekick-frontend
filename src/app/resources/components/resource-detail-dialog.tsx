'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Video,
  Link2,
  Pencil,
  Trash2,
  Eye,
  Download,
  Globe,
  Users,
  ClipboardList,
  Dumbbell,
  FileEdit,
  Newspaper,
  ExternalLink,
  Calendar,
  Tag,
} from 'lucide-react'
import type { SharedResource, SharingScope } from '@/types/resource'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/resource'

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
  client: Users,
  session: Calendar,
}

const SCOPE_LABELS: Record<SharingScope, string> = {
  global: 'All Clients',
  client: 'Specific Client',
  session: 'Specific Session',
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
}

export function ResourceDetailDialog({
  resource,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ResourceDetailDialogProps) {
  if (!resource) return null

  const Icon = CATEGORY_ICONS[resource.category] || FileText
  const ScopeIcon = SCOPE_ICONS[resource.sharing_scope] || Globe
  const colors = CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.general

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg ${colors.bg} shrink-0`}>
              <Icon className={`h-5 w-5 ${colors.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl leading-tight">
                {resource.title}
              </DialogTitle>
              {resource.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {resource.description}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
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
          <div className="flex items-center gap-4 text-sm text-gray-500 py-2 border-y border-gray-100">
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
              {new Date(resource.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Content preview */}
          {resource.content && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Content</h4>
              <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                {resource.content}
              </div>
            </div>
          )}

          {/* File details */}
          {resource.file_url && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">File</h4>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {resource.file_type || 'File'}
                  </p>
                  {resource.file_size && (
                    <p className="text-xs text-gray-500">
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
              <h4 className="text-sm font-medium text-gray-700">Link</h4>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Link2 className="h-5 w-5 text-gray-500" />
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
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
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

          {/* Scope details */}
          {(resource.client_id || resource.session_id) && (
            <div className="space-y-1 text-sm text-gray-500">
              {resource.client_id && <p>Client ID: {resource.client_id}</p>}
              {resource.session_id && <p>Session ID: {resource.session_id}</p>}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
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
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              onOpenChange(false)
              onDelete(resource)
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
