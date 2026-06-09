'use client'

import { useState } from 'react'
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
  Target,
  Calendar,
  AlertCircle,
  Briefcase,
  User,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react'
import { formatDateOnly } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface CommitmentKanbanCardProps {
  commitment: any
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  targets?: any[]
  outcomeMap?: Record<string, string>
}

export function CommitmentKanbanCard({
  commitment,
  onClick,
  onEdit,
  onDelete,
  targets = [],
  outcomeMap,
}: CommitmentKanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('commitmentId', commitment.id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }
  const isCompleted = commitment.status === 'completed'
  const isInProgress = commitment.status === 'in_progress'
  const isOverdue =
    commitment.target_date &&
    new Date(commitment.target_date) < new Date() &&
    !isCompleted

  const priorityColors = {
    urgent: 'bg-vermillion-bg text-vermillion border-vermillion ',
    high: 'bg-amber-token-bg text-amber-token border-amber-token ',
    medium: 'bg-amber-token-bg text-amber-token border-amber-token ',
    low: 'bg-surface-3 text-ink-2 border-line ',
  }

  const getBorderColor = () => {
    if (isCompleted) return 'border-l-green-500'
    if (isInProgress) return 'border-l-blue-500'
    if (isOverdue) return 'border-l-red-500'
    return 'border-l-gray-400'
  }

  const getBgColor = () => {
    if (isCompleted) return 'bg-forest-bg/50 '
    if (isInProgress) return 'bg-ds-accent-bg/50 '
    return ''
  }

  const hasActions = onEdit || onDelete

  // Resolve linked outcome names from either targets array or outcomeMap
  const getOutcomeNames = (): { id: string; title: string }[] => {
    // Try target_links + targets array first
    if (commitment.target_links?.length > 0 && targets.length > 0) {
      return commitment.target_links
        .map((link: any) => {
          const target = targets.find((t: any) => t.id === link.target_id)
          return target ? { id: link.target_id, title: target.title } : null
        })
        .filter(Boolean)
    }

    // Fall back to linked_target_ids + outcomeMap
    if (commitment.linked_target_ids?.length > 0 && outcomeMap) {
      return commitment.linked_target_ids
        .map((id: string) => {
          const title = outcomeMap[id]
          return title ? { id, title } : null
        })
        .filter(Boolean)
    }

    // Try target_links + outcomeMap
    if (commitment.target_links?.length > 0 && outcomeMap) {
      return commitment.target_links
        .map((link: any) => {
          const title = outcomeMap[link.target_id]
          return title ? { id: link.target_id, title } : null
        })
        .filter(Boolean)
    }

    return []
  }

  const outcomes = getOutcomeNames()

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4 group',
        getBorderColor(),
        getBgColor(),
        isDragging && 'opacity-50 rotate-2',
        'hover:border-primary/50',
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Top row: Assignment badge + actions dropdown */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {commitment.is_coach_commitment ? (
              <Badge
                variant="outline"
                className="bg-amber-token-bg border-amber-token text-amber-token text-xs w-fit"
              >
                <Briefcase className="h-3 w-3 mr-1" />
                Coach Task
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-paper border-line text-ink-3 text-xs w-fit"
              >
                <User className="h-3 w-3 mr-1" />
                Client Task
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
          {hasActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={e => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-vermillion"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Title */}
        <h4
          className={cn(
            'text-sm font-semibold line-clamp-2',
            isCompleted ? 'text-forest line-through' : 'text-ink ',
          )}
        >
          {commitment.title}
        </h4>

        {/* Description */}
        {commitment.description && (
          <p className="text-xs text-ink-3 line-clamp-2">
            {commitment.description}
          </p>
        )}

        {/* Linked Outcomes */}
        {outcomes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {outcomes.map(outcome => (
              <Badge
                key={outcome.id}
                variant="outline"
                className="bg-paper border-line text-ink-2 text-xs w-fit"
              >
                <Target className="h-3 w-3 mr-1" />
                {outcome.title}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer: Date and Priority */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-line ">
          {commitment.target_date && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                isOverdue ? 'text-vermillion font-medium' : 'text-ink-3 ',
              )}
            >
              {isOverdue && <AlertCircle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" />
              <span>{formatDateOnly(commitment.target_date, 'MMM d')}</span>
            </div>
          )}

          {commitment.priority && commitment.priority !== 'medium' && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs px-2 py-0.5',
                priorityColors[
                  commitment.priority as keyof typeof priorityColors
                ],
              )}
            >
              {commitment.priority}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
