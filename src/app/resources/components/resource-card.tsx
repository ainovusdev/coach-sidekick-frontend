'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  FileText,
  Video,
  Link2,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  ClipboardList,
  Share2,
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

const SCOPE_LABELS: Record<SharingScope, string> = {
  global: 'Global',
  personal: 'Personal',
  session: 'Session',
}

export function getCategoryIcon(category: ResourceCategory | string) {
  return CATEGORY_ICONS[category] || FileText
}

interface ResourceCardProps {
  resource: SharedResource
  onEdit: (r: SharedResource) => void
  onDelete: (r: SharedResource) => void
  onView: (r: SharedResource) => void
  onShare?: (r: SharedResource) => void
  isOwner?: boolean
  canShare?: boolean
}

export function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onView,
  onShare,
  isOwner = true,
  canShare,
}: ResourceCardProps) {
  const Icon = CATEGORY_ICONS[resource.category] || FileText
  const colors = CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.general
  const shareCount = resource.shares?.length ?? 0

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b border-line hover:bg-paper cursor-pointer transition-colors"
      onClick={() => onView(resource)}
    >
      {/* Category Icon */}
      <div className={`p-2 rounded-lg ${colors.bg} shrink-0`}>
        <Icon className={`h-4 w-4 ${colors.text}`} />
      </div>

      {/* Title + Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-ink truncate">
            {resource.title}
          </h3>
        </div>
        {resource.description && (
          <p className="text-xs text-ink-3 truncate mt-0.5">
            {resource.description}
          </p>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="text-xs hidden sm:inline-flex">
          {SCOPE_LABELS[resource.sharing_scope]}
        </Badge>

        <Badge
          variant="secondary"
          className={`text-xs hidden md:inline-flex ${colors.bg} ${colors.text} border-0`}
        >
          {CATEGORY_LABELS[resource.category] || resource.category}
        </Badge>

        {shareCount > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Badge
                variant="outline"
                className="text-xs gap-1 cursor-pointer hover:bg-surface-3 "
                onClick={e => e.stopPropagation()}
              >
                <Share2 className="h-3 w-3" />
                {shareCount}
              </Badge>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-auto max-w-64 p-3"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-xs font-medium text-ink-3 mb-2">Shared with</p>
              <div className="flex flex-wrap gap-1.5">
                {resource.shares?.slice(0, 3).map(share => (
                  <span
                    key={share.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-line text-ink-2 bg-paper "
                  >
                    {share.shared_with_name || 'Unknown'}
                  </span>
                ))}
                {shareCount > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-ink-3 bg-surface-3 ">
                    +{shareCount - 3} more
                  </span>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        <span className="text-xs text-ink-4 hidden lg:inline">
          {formatDate(resource.created_at)}
        </span>

        {/* Actions Menu */}
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
          <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onView(resource)}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            {(canShare ?? isOwner) && onShare && (
              <DropdownMenuItem onClick={() => onShare(resource)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
            )}
            {isOwner && resource.sharing_scope !== 'global' && (
              <>
                <DropdownMenuItem onClick={() => onEdit(resource)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(resource)}
                  className="text-vermillion"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
