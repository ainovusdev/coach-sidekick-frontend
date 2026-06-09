'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { commitmentTypeLabels } from '@/types/commitment'
import {
  Target,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateOnly } from '@/lib/date-utils'

interface ActiveCommitmentsCardProps {
  clientId: string
  onViewAll?: () => void
}

export function ActiveCommitmentsCard({
  clientId,
  onViewAll,
}: ActiveCommitmentsCardProps) {
  const { data, isLoading } = useCommitments({
    client_id: clientId,
    // Drafts are excluded here — unconfirmed (transcript-extracted) commitments
    // are only reviewed on the session detail page and the /commitments page.
  })

  const allCommitments = data?.commitments || []

  // Show ALL commitments (not filtering by status anymore)
  const displayCommitments = allCommitments.slice(0, 5) // Show max 5

  if (isLoading) {
    return (
      <Card className="border-line shadow-sm">
        <CardHeader className="border-b border-line ">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-line shadow-sm">
      <CardHeader className="border-b border-line ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-forest-bg rounded-lg">
              <Target className="h-5 w-5 text-forest " />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink ">
                Client Commitments
              </h2>
              <p className="text-sm text-ink-3 ">
                {allCommitments.length} total commitments
              </p>
            </div>
          </div>
          {allCommitments.length > 0 && onViewAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="hover:bg-paper "
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {allCommitments.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-ink-2 mx-auto mb-3" />
            <h3 className="text-ink font-medium mb-1">No commitments yet</h3>
            <p className="text-sm text-ink-3 ">
              Create commitments to track progress and accountability
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayCommitments.map(commitment => {
              const daysUntilDeadline = commitment.days_until_deadline
              const isOverdue = daysUntilDeadline && daysUntilDeadline < 0
              const isDueSoon =
                daysUntilDeadline &&
                daysUntilDeadline >= 0 &&
                daysUntilDeadline <= 7

              return (
                <div
                  key={commitment.id}
                  className="p-4 border border-line rounded-lg hover:border-line-strong transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-ink mb-1 truncate">
                        {commitment.title}
                      </h4>
                      {commitment.description && (
                        <p className="text-sm text-ink-3 line-clamp-2 mb-2">
                          {commitment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            commitment.type === 'commitment' &&
                              'bg-ds-accent-bg border-ds-accent text-ds-accent ',
                            commitment.type === 'habit' &&
                              'bg-indigo-bg border-indigo text-indigo ',
                            commitment.type === 'mp_outcome' &&
                              'bg-amber-token-bg border-amber-token text-amber-token ',
                            commitment.type === 'learning' &&
                              'bg-forest-bg border-forest text-forest ',
                            commitment.type === 'sprint' &&
                              'bg-indigo-bg border-indigo text-indigo ',
                          )}
                        >
                          {commitmentTypeLabels[commitment.type] ||
                            commitment.type}
                        </Badge>
                        {commitment.target_date && (
                          <div
                            className={cn(
                              'flex items-center gap-1 text-xs',
                              isOverdue && 'text-vermillion',
                              isDueSoon && 'text-amber-token',
                              !isOverdue && !isDueSoon && 'text-ink-3 ',
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            <span>
                              {isOverdue
                                ? `Overdue by ${Math.abs(daysUntilDeadline!)} days`
                                : isDueSoon
                                  ? `Due in ${daysUntilDeadline} days`
                                  : formatDateOnly(
                                      commitment.target_date,
                                      'MMM d',
                                    )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {commitment.progress_percentage > 0 && (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-sm font-medium text-forest ">
                          <TrendingUp className="h-3 w-3" />
                          <span>{commitment.progress_percentage}%</span>
                        </div>
                        {commitment.progress_percentage >= 100 && (
                          <CheckCircle2 className="h-4 w-4 text-forest" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {allCommitments.length > 5 && (
              <p className="text-sm text-ink-3 text-center pt-2">
                +{allCommitments.length - 5} more commitments
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
