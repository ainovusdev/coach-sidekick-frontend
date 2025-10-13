'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SessionNote,
  NOTE_TYPE_LABELS,
  NOTE_TYPE_COLORS,
} from '@/types/session-note'
import { MoreVertical, Edit, Trash2, Calendar } from 'lucide-react'

interface NoteCardProps {
  note: SessionNote
  onEdit?: (note: SessionNote) => void
  onDelete?: (note: SessionNote) => void
  showActions?: boolean
  isClientPortal?: boolean
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  showActions = true,
  isClientPortal = false,
}: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const typeColor = NOTE_TYPE_COLORS[note.note_type]

  // Check if content is long (more than 300 characters)
  const isLongContent = note.content.length > 300
  const displayContent =
    isLongContent && !isExpanded
      ? note.content.substring(0, 300) + '...'
      : note.content

  return (
    <Card
      className={`${
        isClientPortal
          ? 'bg-zinc-900 border-zinc-800'
          : 'bg-white border-gray-200'
      } hover:shadow-md transition-shadow`}
    >
      <CardHeader
        className={`pb-3 ${isClientPortal ? 'border-b border-zinc-800' : 'border-b border-gray-200'}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={`${typeColor.bg} ${typeColor.text} ${typeColor.border}`}
              >
                {NOTE_TYPE_LABELS[note.note_type]}
              </Badge>
              {note.is_visible_to_client &&
                note.note_type !== 'client_reflection' && (
                  <Badge
                    variant="outline"
                    className={`${
                      isClientPortal
                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        : 'bg-gray-100 text-gray-600 border-gray-300'
                    }`}
                  >
                    Shared
                  </Badge>
                )}
            </div>
            <h3
              className={`text-lg font-semibold ${
                isClientPortal ? 'text-white' : 'text-gray-900'
              }`}
            >
              {note.title}
            </h3>
          </div>

          {showActions && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    isClientPortal
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      : 'text-gray-500 hover:text-gray-700'
                  }
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={isClientPortal ? 'bg-zinc-900 border-zinc-800' : ''}
              >
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(note)}
                    className={
                      isClientPortal
                        ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                        : ''
                    }
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(note)}
                    className={
                      isClientPortal
                        ? 'text-red-400 hover:bg-zinc-800 hover:text-red-300'
                        : 'text-red-600'
                    }
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Content */}
        <div
          className={`prose prose-sm max-w-none mb-4 ${
            isClientPortal
              ? 'prose-invert prose-headings:text-white prose-p:text-zinc-300 prose-li:text-zinc-300'
              : 'prose-gray'
          }`}
        >
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {displayContent}
          </pre>
        </div>

        {/* Show more/less button */}
        {isLongContent && (
          <Button
            variant="link"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-0 h-auto ${
              isClientPortal
                ? 'text-blue-400 hover:text-blue-300'
                : 'text-blue-600'
            }`}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        )}

        {/* Metadata */}
        <div
          className={`flex items-center gap-4 mt-4 pt-4 border-t text-xs ${
            isClientPortal
              ? 'border-zinc-800 text-zinc-500'
              : 'border-gray-200 text-gray-500'
          }`}
        >
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(note.created_at)}</span>
          </div>
          {note.updated_at !== note.created_at && (
            <span className="text-xs">
              (edited {formatDate(note.updated_at)})
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
