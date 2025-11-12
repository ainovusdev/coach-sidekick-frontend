'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCommitments } from '@/hooks/queries/use-commitments'
import {
  Target,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

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
    // Remove status filter to show all commitments
    // status: 'active',
    include_drafts: true,
  })

  console.log('ActiveCommitmentsCard - clientId:', clientId)
  console.log('ActiveCommitmentsCard - data:', data)
  console.log('ActiveCommitmentsCard - isLoading:', isLoading)

  const allCommitments = data?.commitments || []
  console.log('ActiveCommitmentsCard - allCommitments:', allCommitments)

  // Show ALL commitments (not filtering by status anymore)
  const displayCommitments = allCommitments.slice(0, 5) // Show max 5
  console.log('ActiveCommitmentsCard - displayCommitments:', displayCommitments)

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
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
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Client Commitments
              </h2>
              <p className="text-sm text-gray-500">
                {allCommitments.length} total commitments
              </p>
            </div>
          </div>
          {allCommitments.length > 0 && onViewAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="hover:bg-gray-50"
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
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-900 font-medium mb-1">
              No commitments yet
            </h3>
            <p className="text-sm text-gray-500">
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
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 mb-1 truncate">
                        {commitment.title}
                      </h4>
                      {commitment.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {commitment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            commitment.type === 'action' &&
                              'bg-blue-50 border-blue-200 text-blue-700',
                            commitment.type === 'habit' &&
                              'bg-purple-50 border-purple-200 text-purple-700',
                            commitment.type === 'milestone' &&
                              'bg-orange-50 border-orange-200 text-orange-700',
                            commitment.type === 'learning' &&
                              'bg-green-50 border-green-200 text-green-700',
                          )}
                        >
                          {commitment.type}
                        </Badge>
                        {commitment.target_date && (
                          <div
                            className={cn(
                              'flex items-center gap-1 text-xs',
                              isOverdue && 'text-red-600',
                              isDueSoon && 'text-orange-600',
                              !isOverdue && !isDueSoon && 'text-gray-600',
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            <span>
                              {isOverdue
                                ? `Overdue by ${Math.abs(daysUntilDeadline!)} days`
                                : isDueSoon
                                  ? `Due in ${daysUntilDeadline} days`
                                  : new Date(
                                      commitment.target_date,
                                    ).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {commitment.progress_percentage > 0 && (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          <span>{commitment.progress_percentage}%</span>
                        </div>
                        {commitment.progress_percentage >= 100 && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {allCommitments.length > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                +{allCommitments.length - 5} more commitments
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
