'use client'

import { Target, Sprint } from '@/types/sprint'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  Circle,
  Calendar,
  Link2,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OutcomeCardProps {
  outcome: Target
  sprints: Sprint[]
  isSelected?: boolean
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onComplete?: () => void
  onSprintClick?: (sprint: Sprint) => void
}

export function OutcomeCard({
  outcome,
  sprints,
  isSelected = false,
  onClick,
  onEdit,
  onDelete,
  onComplete,
  onSprintClick,
}: OutcomeCardProps) {
  // Get sprints linked to this outcome
  const linkedSprints = sprints.filter(s => outcome.sprint_ids?.includes(s.id))
  const activeSprints = linkedSprints.filter(s => s.status === 'active')

  const isCompleted = outcome.status === 'completed'

  return (
    <Card
      className={cn(
        'border-2 transition-all cursor-pointer',
        isCompleted && 'border-forest bg-forest-bg/50',
        isSelected && !isCompleted && 'border-primary bg-primary/5',
        !isCompleted && !isSelected && 'hover:border-line-strong',
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Title Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isCompleted ? (
              <CheckCircle className="h-5 w-5 text-forest flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-ink-4 flex-shrink-0" />
            )}
            <h4 className="font-semibold text-sm truncate">{outcome.title}</h4>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant={isCompleted ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                isCompleted && 'bg-forest-bg text-forest',
              )}
            >
              {outcome.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation()
                      onEdit()
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onComplete && !isCompleted && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation()
                      onComplete()
                    }}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    className="text-vermillion"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3 flex items-center gap-3">
          <Progress value={outcome.progress_percentage} className="flex-1" />
          <span className="text-xs font-medium text-ink-3 w-10 text-right">
            {outcome.progress_percentage}%
          </span>
        </div>

        {/* Sprint Badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          {linkedSprints.map(sprint => (
            <Badge
              key={sprint.id}
              variant={sprint.status === 'active' ? 'default' : 'secondary'}
              className={cn(
                'cursor-pointer hover:opacity-80 text-xs',
                sprint.status === 'active' && 'bg-ds-accent-bg text-ds-accent',
              )}
              onClick={e => {
                e.stopPropagation()
                onSprintClick?.(sprint)
              }}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {sprint.title}
              {sprint.status === 'active' && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-forest" />
              )}
            </Badge>
          ))}
          {linkedSprints.length === 0 && (
            <span className="text-xs text-ink-3 italic">
              No sprint assigned
            </span>
          )}
        </div>

        {/* Commitment count */}
        <div className="mt-2 flex items-center gap-4 text-xs text-ink-3">
          <div className="flex items-center gap-1">
            <Link2 className="h-3.5 w-3.5" />
            <span>
              {outcome.completed_commitment_count || 0}/
              {outcome.commitment_count || 0} commitments
            </span>
          </div>
          {activeSprints.length > 0 && (
            <div className="flex items-center gap-1 text-ds-accent">
              <Calendar className="h-3.5 w-3.5" />
              <span>{activeSprints.length} active sprint(s)</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
