'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Calendar, AlertCircle, Briefcase, User } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface CommitmentKanbanCardProps {
  commitment: any
  onClick?: () => void
  targets?: any[] // Available targets to lookup titles
}

export function CommitmentKanbanCard({
  commitment,
  onClick,
  targets = [],
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

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4',
        getBorderColor(),
        getBgColor(),
        isDragging && 'opacity-50 rotate-2',
        'hover:border-primary/50',
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Task Assignment Badge */}
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

        {/* Linked Outcome - show if linked via targets */}
        {commitment.target_links && commitment.target_links.length > 0 && (
          <Badge
            variant="outline"
            className="bg-gray-50 border-gray-200 text-gray-700 text-xs w-fit"
          >
            <Target className="h-3 w-3 mr-1" />
            {(() => {
              const targetId = commitment.target_links[0].target_id
              const target = targets.find((t: any) => t.id === targetId)
              return target?.title || 'Outcome'
            })()}
          </Badge>
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
