'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Video,
  Link2,
  MoreVertical,
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
} from 'lucide-react'
import type {
  SharedResource,
  SharingScope,
  ResourceCategory,
} from '@/types/resource'
import { formatDate } from '@/lib/date-utils'
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
  session: ClipboardList,
}

const SCOPE_LABELS: Record<SharingScope, string> = {
  global: 'Global',
  client: 'Client-specific',
  session: 'Session-specific',
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getCategoryIcon(category: ResourceCategory | string) {
  return CATEGORY_ICONS[category] || FileText
}

interface ResourceCardProps {
  resource: SharedResource
  onEdit: (r: SharedResource) => void
  onDelete: (r: SharedResource) => void
  onView: (r: SharedResource) => void
}

export function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onView,
}: ResourceCardProps) {
  const Icon = CATEGORY_ICONS[resource.category] || FileText
  const ScopeIcon = SCOPE_ICONS[resource.sharing_scope] || Globe
  const colors = CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.general

  return (
    <Card
      className="border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(resource)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg ${colors.bg} shrink-0`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {resource.title}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(resource)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(resource)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(resource)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {resource.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {resource.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3 flex-wrap">
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
                <span className="text-xs text-gray-400">
                  {formatFileSize(resource.file_size)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {resource.view_count} views
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {resource.download_count} downloads
              </span>
              <span>{formatDate(resource.created_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
