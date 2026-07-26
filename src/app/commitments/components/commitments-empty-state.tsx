'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, FilterX, Plus, Target } from 'lucide-react'
import { CommitmentTab, DueFilter } from '../utils/commitment-view'

interface CommitmentsEmptyStateProps {
  tab: CommitmentTab
  dueFilter: DueFilter
  searchActive: boolean
  hasActiveFilters: boolean
  onClearFilters: () => void
  onCreate: () => void
}

export function CommitmentsEmptyState({
  tab,
  dueFilter,
  searchActive,
  hasActiveFilters,
  onClearFilters,
  onCreate,
}: CommitmentsEmptyStateProps) {
  let title = 'No commitments found'
  let message =
    'Commitments are created during sessions or manually by coaches.'
  let Icon = Target

  if (dueFilter === 'overdue' && !searchActive) {
    title = 'Nothing overdue'
    message = 'No commitments are past their due date. Nice work.'
    Icon = AlertCircle
  } else if (tab === 'drafts') {
    title = 'No drafts to review'
    message =
      'Drafts are created when AI extracts commitments from session transcripts.'
  } else if (hasActiveFilters) {
    title = 'No matching commitments'
    message = 'Nothing matches the current search and filters.'
    Icon = FilterX
  }

  return (
    <Card className="border-line ">
      <CardContent className="py-16 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-surface-3 rounded-full mb-4">
          <Icon className="h-7 w-7 text-ink-4" />
        </div>
        <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
        <p className="text-sm text-ink-3 mb-4">{message}</p>
        <div className="flex items-center justify-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="border-line-strong "
            >
              <FilterX className="h-4 w-4 mr-2" />
              Clear filters
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onCreate}
            className="border-line-strong "
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Commitment
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
