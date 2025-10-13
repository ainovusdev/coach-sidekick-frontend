'use client'

import React from 'react'
import { Milestone, MilestoneStatus } from '@/types/commitment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, XCircle, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

interface MilestoneListProps {
  milestones: Milestone[]
  onToggleComplete?: (milestoneId: string) => void
  readOnly?: boolean
  compact?: boolean
}

const statusConfig: Record<
  MilestoneStatus,
  { icon: React.ElementType; className: string }
> = {
  pending: { icon: Circle, className: 'text-gray-400' },
  in_progress: { icon: Circle, className: 'text-blue-500' },
  completed: { icon: CheckCircle2, className: 'text-green-500' },
  skipped: { icon: XCircle, className: 'text-gray-400' },
}

export function MilestoneList({
  milestones,
  onToggleComplete,
  readOnly = false,
  compact = false,
}: MilestoneListProps) {
  const sortedMilestones = [...milestones].sort(
    (a, b) => a.order_index - b.order_index,
  )

  const completedCount = milestones.filter(m => m.status === 'completed').length
  const progressPercentage =
    milestones.length > 0
      ? Math.round((completedCount / milestones.length) * 100)
      : 0

  if (milestones.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No milestones yet
      </div>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Milestones</span>
          <span className="font-medium">
            {completedCount} / {milestones.length} ({progressPercentage}%)
          </span>
        </div>
        <div className="space-y-2">
          {sortedMilestones.map(milestone => {
            const StatusIcon = statusConfig[milestone.status].icon
            return (
              <div
                key={milestone.id}
                className={cn(
                  'flex items-start gap-2 p-2 rounded-md border',
                  milestone.status === 'completed' &&
                    'bg-green-500/5 border-green-500/20',
                )}
              >
                <StatusIcon
                  className={cn(
                    'size-4 mt-0.5 flex-shrink-0',
                    statusConfig[milestone.status].className,
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm',
                      milestone.status === 'completed' &&
                        'line-through text-muted-foreground',
                    )}
                  >
                    {milestone.title}
                  </p>
                  {milestone.target_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Calendar className="size-3 inline mr-1" />
                      {format(parseISO(milestone.target_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                {!readOnly &&
                  onToggleComplete &&
                  milestone.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onToggleComplete(milestone.id)}
                      className="h-6 px-2"
                    >
                      Complete
                    </Button>
                  )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Milestones</CardTitle>
          <Badge variant="outline">
            {completedCount} / {milestones.length} Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedMilestones.map((milestone, index) => {
            const StatusIcon = statusConfig[milestone.status].icon
            return (
              <div key={milestone.id} className="relative">
                {/* Connecting Line */}
                {index < sortedMilestones.length - 1 && (
                  <div className="absolute left-4 top-8 h-full w-px bg-border" />
                )}

                {/* Milestone Item */}
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'relative z-10 flex size-8 items-center justify-center rounded-full border-2 bg-background',
                      milestone.status === 'completed'
                        ? 'border-green-500 bg-green-500/10'
                        : milestone.status === 'in_progress'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-300',
                    )}
                  >
                    <StatusIcon
                      className={cn(
                        'size-5',
                        statusConfig[milestone.status].className,
                      )}
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4
                          className={cn(
                            'font-medium',
                            milestone.status === 'completed' &&
                              'line-through text-muted-foreground',
                          )}
                        >
                          {milestone.title}
                        </h4>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {milestone.description}
                          </p>
                        )}
                      </div>

                      {!readOnly &&
                        onToggleComplete &&
                        milestone.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onToggleComplete(milestone.id)}
                          >
                            Mark Complete
                          </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {milestone.target_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          <span>
                            {format(
                              parseISO(milestone.target_date),
                              'MMM d, yyyy',
                            )}
                          </span>
                        </div>
                      )}
                      {milestone.completed_date && (
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-600"
                        >
                          Completed{' '}
                          {format(parseISO(milestone.completed_date), 'MMM d')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
