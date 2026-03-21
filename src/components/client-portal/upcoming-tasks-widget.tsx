'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Target,
  ArrowRight,
  AlertCircle,
  Circle,
  PlayCircle,
} from 'lucide-react'
import { formatDate, isPastDate } from '@/lib/date-utils'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { commitmentTypeLabels } from '@/types/commitment'
import type { Commitment } from '@/types/commitment'

interface UpcomingCommitmentsWidgetProps {
  clientId?: string
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function UpcomingTasksWidget({
  clientId,
}: UpcomingCommitmentsWidgetProps) {
  const { data: commitmentsData } = useCommitments(
    clientId ? { client_id: clientId } : undefined,
    { enabled: !!clientId },
  )

  const upcoming = (commitmentsData?.commitments ?? [])
    .filter(
      (c: Commitment) => c.status === 'active' || c.status === 'in_progress',
    )
    .sort((a: Commitment, b: Commitment) => {
      if (!a.target_date) return 1
      if (!b.target_date) return -1
      return (
        new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
      )
    })
    .slice(0, 5)

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            Upcoming Commitments
          </CardTitle>
          <Link href="/client-portal/dashboard">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No active commitments
          </p>
        ) : (
          <div className="space-y-2.5">
            {upcoming.map((commitment: Commitment) => {
              const isOverdue =
                commitment.target_date && isPastDate(commitment.target_date)
              return (
                <div
                  key={commitment.id}
                  className="flex items-start gap-2.5 py-1.5"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {commitment.status === 'in_progress' ? (
                      <PlayCircle className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {commitment.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 h-4 ${priorityColors[commitment.priority] || priorityColors.low}`}
                      >
                        {commitment.priority}
                      </Badge>
                      {commitment.type && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {commitmentTypeLabels[commitment.type] ||
                            commitment.type}
                        </span>
                      )}
                      {commitment.target_date && (
                        <span
                          className={`text-xs flex items-center gap-1 ${
                            isOverdue
                              ? 'text-red-600 dark:text-red-400 font-medium'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {isOverdue && <AlertCircle className="h-3 w-3" />}
                          {formatDate(commitment.target_date, 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
