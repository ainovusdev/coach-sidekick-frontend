'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Sparkles } from 'lucide-react'
import { Commitment, commitmentTypeLabels } from '@/types/commitment'
import { formatDate } from '@/lib/date-utils'
interface CommitmentListItemProps {
  commitment: Commitment
  onUpdate?: () => void
  onEdit?: (commitment: Commitment) => void
}

export function CommitmentListItem({
  commitment,
  onEdit,
}: CommitmentListItemProps) {
  return (
    <Card className="border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h5 className="font-medium text-gray-900 dark:text-white mb-1">
              {commitment.title}
            </h5>
            {commitment.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {commitment.description}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">
                {commitmentTypeLabels[commitment.type] || commitment.type}
              </Badge>
              <Badge
                variant="secondary"
                className={
                  commitment.priority === 'high' ||
                  commitment.priority === 'urgent'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : commitment.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }
              >
                {commitment.priority}
              </Badge>
              {commitment.target_date && (
                <Badge variant="outline" className="text-xs">
                  Due: {formatDate(commitment.target_date)}
                </Badge>
              )}
              {commitment.progress_percentage > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  {commitment.progress_percentage}% complete
                </Badge>
              )}
              {commitment.extracted_from_transcript && (
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Extracted
                </Badge>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(commitment)}
            className="flex-shrink-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
