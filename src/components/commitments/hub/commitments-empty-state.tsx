'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, FilterX, Plus, Target, UserRound } from 'lucide-react'
import { CommitmentTab, CommitmentView, DueFilter } from './commitment-view'

interface CommitmentsEmptyStateProps {
  tab: CommitmentTab
  view: CommitmentView
  /** A specific person is filtered (`assignee=`); their display name. */
  personName?: string | null
  dueFilter: DueFilter
  searchActive: boolean
  hasActiveFilters: boolean
  onClearFilters: () => void
  onCreate: () => void
}

const VIEW_EMPTY: Record<
  Exclude<CommitmentView, 'all'>,
  { title: string; message: string }
> = {
  mine: {
    title: 'Nothing assigned to you',
    message: 'When a colleague or client hands you something, it lands here.',
  },
  unassigned: {
    title: 'Nothing unassigned',
    message: 'Everything here has a person on it.',
  },
  clients: {
    title: 'No client commitments',
    message: 'What your clients commit to in sessions shows up here.',
  },
  others: {
    title: 'Nothing handed out yet',
    message:
      'Assign a commitment to a coach or colleague and it shows up here.',
  },
}

export function CommitmentsEmptyState({
  tab,
  view,
  personName,
  dueFilter,
  searchActive,
  hasActiveFilters,
  onClearFilters,
  onCreate,
}: CommitmentsEmptyStateProps) {
  let title = 'No commitments yet'
  let message =
    'Commitments come out of sessions, or you can create one for anyone.'
  let Icon = Target

  if (dueFilter === 'overdue' && !searchActive) {
    title = 'Nothing overdue'
    message = 'No commitments are past their due date. Nice work.'
    Icon = AlertCircle
  } else if (dueFilter === 'today' && !searchActive) {
    title = 'Nothing due today'
    message = 'No commitment on your list is due today.'
    Icon = AlertCircle
  } else if (tab === 'drafts' && !searchActive) {
    title = 'No drafts to review'
    message =
      'Drafts are created when AI extracts commitments from session transcripts.'
  } else if (personName !== undefined && personName !== null && !searchActive) {
    title = `Nothing for ${personName}`
    message = 'Nothing is assigned to them right now.'
    Icon = UserRound
  } else if (view !== 'all' && !searchActive) {
    title = VIEW_EMPTY[view].title
    message = VIEW_EMPTY[view].message
    Icon = UserRound
  } else if (hasActiveFilters) {
    title = 'No matching commitments'
    message = 'Nothing matches the current search and filters.'
    Icon = FilterX
  }

  return (
    <Card className="border-line " data-testid="hub-empty">
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
            New commitment
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
