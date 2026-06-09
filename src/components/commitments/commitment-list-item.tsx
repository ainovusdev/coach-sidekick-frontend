'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Sparkles } from 'lucide-react'
import { Commitment, commitmentTypeLabels } from '@/types/commitment'
import { formatDateOnly } from '@/lib/date-utils'
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
    <Card className="border-line hover:border-ds-accent transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h5 className="font-medium text-ink mb-1">{commitment.title}</h5>
            {commitment.description && (
              <p className="text-sm text-ink-3 mb-2 line-clamp-2">
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
                    ? 'bg-vermillion-bg text-vermillion '
                    : commitment.priority === 'medium'
                      ? 'bg-amber-token-bg text-amber-token '
                      : 'bg-surface-3 text-ink-2 '
                }
              >
                {commitment.priority}
              </Badge>
              {commitment.target_date && (
                <Badge variant="outline" className="text-xs">
                  Due: {formatDateOnly(commitment.target_date)}
                </Badge>
              )}
              {commitment.progress_percentage > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-forest-bg text-forest "
                >
                  {commitment.progress_percentage}% complete
                </Badge>
              )}
              {commitment.extracted_from_transcript && (
                <Badge variant="secondary" className="bg-surface-3 text-ink-2 ">
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
