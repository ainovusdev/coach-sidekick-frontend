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
  TrendingUp,
} from 'lucide-react'
import { format } from 'date-fns'
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
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-gray-100 text-gray-700 border-gray-200',
  }

  const getBorderColor = () => {
    if (isCompleted) return 'border-l-green-500'
    if (isInProgress) return 'border-l-blue-500'
    if (isOverdue) return 'border-l-red-500'
    return 'border-l-gray-400'
  }

  const getBgColor = () => {
    if (isCompleted) return 'bg-green-50/50'
    if (isInProgress) return 'bg-blue-50/50'
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
      onClick={hasActions ? undefined : onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Top row: Assignment badge + actions dropdown */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {commitment.is_coach_commitment ? (
              <Badge
                variant="outline"
                className="bg-amber-50 border-amber-300 text-amber-800 text-xs w-fit"
              >
                <Briefcase className="h-3 w-3 mr-1" />
                Coach Task
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-slate-50 border-slate-200 text-slate-600 text-xs w-fit"
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
                {onClick && (
                  <DropdownMenuItem onClick={onClick}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Update Progress
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
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
            isCompleted ? 'text-green-700 line-through' : 'text-gray-900',
          )}
        >
          {commitment.title}
        </h4>

        {/* Description */}
        {commitment.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
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
                className="bg-gray-50 border-gray-200 text-gray-700 text-xs w-fit"
              >
                <Target className="h-3 w-3 mr-1" />
                {outcome.title}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer: Date and Priority */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
          {commitment.target_date && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                isOverdue ? 'text-red-600 font-medium' : 'text-gray-600',
              )}
            >
              {isOverdue && <AlertCircle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(commitment.target_date), 'MMM d')}</span>
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
