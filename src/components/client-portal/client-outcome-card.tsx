'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Circle, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ClientOutcome } from '@/services/client-outcome-service'

interface ClientOutcomeCardProps {
  outcome: ClientOutcome
  onClick?: () => void
}

export function ClientOutcomeCard({
  outcome,
  onClick,
}: ClientOutcomeCardProps) {
  const isCompleted = outcome.status === 'completed'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'active':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'deferred':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'abandoned':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <Card
      className={cn(
        'border transition-all cursor-pointer hover:shadow-sm',
        isCompleted &&
          'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20',
        !isCompleted && 'hover:border-gray-300 dark:hover:border-gray-600',
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Title Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            )}
            <h4 className="font-semibold text-sm truncate text-gray-900 dark:text-white">
              {outcome.title}
            </h4>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'text-xs flex-shrink-0',
              getStatusColor(outcome.status),
            )}
          >
            {outcome.status}
          </Badge>
        </div>

        {/* Description */}
        {outcome.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 ml-7">
            {outcome.description}
          </p>
        )}

        {/* Progress */}
        <div className="mt-3 flex items-center gap-3 ml-7">
          <Progress value={outcome.progress_percentage} className="flex-1" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-10 text-right">
            {outcome.progress_percentage}%
          </span>
        </div>

        {/* Commitment count */}
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 ml-7">
          <Link2 className="h-3.5 w-3.5" />
          <span>
            {outcome.completed_commitment_count}/{outcome.commitment_count}{' '}
            commitments
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
