'use client'

import React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Commitment,
  CommitmentPriority,
  CommitmentStatus,
} from '@/types/commitment'
import {
  formatDistanceToNow,
  isPast,
  parseISO,
  differenceInDays,
} from 'date-fns'
import {
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommitmentCardProps {
  commitment: Commitment
  onEdit?: (commitment: Commitment) => void
  onDelete?: (commitmentId: string) => void
  onUpdateProgress?: (commitment: Commitment) => void
  compact?: boolean
  className?: string
}

const statusConfig: Record<
  CommitmentStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  },
  active: {
    label: 'Active',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
  abandoned: {
    label: 'Abandoned',
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
}

const priorityConfig: Record<
  CommitmentPriority,
  { label: string; className: string }
> = {
  low: {
    label: 'Low',
    className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  },
  high: {
    label: 'High',
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
}

const typeLabels: Record<string, string> = {
  action: 'Action',
  habit: 'Habit',
  milestone: 'Milestone',
  learning: 'Learning',
}

export function CommitmentCard({
  commitment,
  onEdit,
  onDelete,
  onUpdateProgress,
  compact = false,
  className,
}: CommitmentCardProps) {
  const statusInfo = statusConfig[commitment.status]
  const priorityInfo = priorityConfig[commitment.priority]

  // Calculate deadline status
  const getDeadlineInfo = () => {
    if (!commitment.target_date) return null

    const targetDate = parseISO(commitment.target_date)
    const daysUntil = differenceInDays(targetDate, new Date())
    const isOverdue = isPast(targetDate) && commitment.status !== 'completed'

    if (isOverdue) {
      return {
        text: `Overdue by ${Math.abs(daysUntil)} days`,
        className: 'text-red-600',
        icon: AlertCircle,
      }
    } else if (daysUntil <= 7) {
      return {
        text: `Due in ${daysUntil} days`,
        className: 'text-orange-600',
        icon: Clock,
      }
    } else {
      return {
        text: formatDistanceToNow(targetDate, { addSuffix: true }),
        className: 'text-muted-foreground',
        icon: Clock,
      }
    }
  }

  const deadlineInfo = getDeadlineInfo()

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors',
          className,
        )}
      >
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{commitment.title}</h4>
            <Badge variant="outline" className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
          </div>
          <Progress value={commitment.progress_percentage} className="h-1.5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {commitment.progress_percentage}%
          </span>
          {onUpdateProgress && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUpdateProgress(commitment)}
            >
              <TrendingUp className="size-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={statusInfo.className}>
                {statusInfo.label}
              </Badge>
              <Badge variant="outline" className={priorityInfo.className}>
                {priorityInfo.label}
              </Badge>
              <Badge variant="outline">{typeLabels[commitment.type]}</Badge>
              {commitment.extracted_from_transcript && (
                <Badge
                  variant="outline"
                  className="bg-purple-500/10 text-purple-600"
                >
                  AI Extracted
                </Badge>
              )}
            </div>
            <CardTitle>{commitment.title}</CardTitle>
            {commitment.description && (
              <CardDescription>{commitment.description}</CardDescription>
            )}
          </div>
          {(onEdit || onDelete) && (
            <CardAction>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(commitment)}>
                      <Edit className="size-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(commitment.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {commitment.progress_percentage}%
            </span>
          </div>
          <Progress value={commitment.progress_percentage} className="h-2" />
        </div>

        {/* Deadline */}
        {deadlineInfo && (
          <div className="flex items-center gap-2 text-sm">
            <deadlineInfo.icon
              className={cn('size-4', deadlineInfo.className)}
            />
            <span className={deadlineInfo.className}>{deadlineInfo.text}</span>
          </div>
        )}

        {/* Measurement Criteria */}
        {commitment.measurement_criteria && (
          <div className="text-sm">
            <span className="text-muted-foreground">Success Criteria: </span>
            <span>{commitment.measurement_criteria}</span>
          </div>
        )}

        {/* Milestones */}
        {commitment.milestones && commitment.milestones.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Milestones: </span>
            <span>
              {
                commitment.milestones.filter(m => m.status === 'completed')
                  .length
              }{' '}
              / {commitment.milestones.length} completed
            </span>
          </div>
        )}

        {/* Metadata */}
        {commitment.client_name && (
          <div className="text-sm text-muted-foreground">
            Client: {commitment.client_name}
          </div>
        )}
      </CardContent>

      {onUpdateProgress && commitment.status === 'active' && (
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => onUpdateProgress(commitment)}
            variant="outline"
          >
            <TrendingUp className="size-4 mr-2" />
            Update Progress
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
