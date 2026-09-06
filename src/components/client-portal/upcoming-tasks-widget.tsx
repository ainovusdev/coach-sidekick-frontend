'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Target,
  ArrowRight,
  AlertCircle,
  Circle,
  PlayCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateOnly, isPastDate } from '@/lib/date-utils'
import { useAuth } from '@/contexts/auth-context'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { isAssignedTo, isClientsOwn } from '@/lib/commitments/assignee'
import { priorityInfo } from '@/lib/commitments/labels'
import { TONE_CLASS } from '@/lib/tone'
import { AssigneeChip } from '@/components/people/assignee-chip'
import { commitmentTypeLabels } from '@/types/commitment'
import type { Commitment } from '@/types/commitment'

interface UpcomingCommitmentsWidgetProps {
  clientId?: string
  /** Open a commitment (the dashboard's detail panel). Rows are static without it. */
  onOpen?: (commitment: Commitment) => void
}

const OPEN = new Set(['active', 'in_progress'])

function byDueDate(a: Commitment, b: Commitment) {
  if (!a.target_date) return 1
  if (!b.target_date) return -1
  return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
}

/**
 * The coachee's own open commitments, soonest first. Anything on this profile
 * that is someone else's (the coach's, say) sits in a collapsed group below,
 * labelled by the person — the coachee can read it, not edit it.
 */
export function UpcomingTasksWidget({
  clientId,
  onOpen,
}: UpcomingCommitmentsWidgetProps) {
  const { userId } = useAuth()
  const [showOthers, setShowOthers] = useState(false)
  const { data: commitmentsData } = useCommitments(
    clientId ? { client_id: clientId } : undefined,
    { enabled: !!clientId },
  )

  const { mine, others } = useMemo(() => {
    const open = (commitmentsData?.commitments ?? []).filter((c: Commitment) =>
      OPEN.has(c.status),
    )
    const mine: Commitment[] = []
    const others: Commitment[] = []
    for (const c of open) {
      if (isClientsOwn(c) || isAssignedTo(c, userId)) mine.push(c)
      else others.push(c)
    }
    return {
      mine: mine.sort(byDueDate).slice(0, 5),
      others: others.sort(byDueDate),
    }
  }, [commitmentsData, userId])

  return (
    <Card className="border-line" data-testid="portal-your-commitments">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-ink-3 " />
            Your commitments
          </CardTitle>
          <Link href="/client-portal/dashboard">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              View all
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {mine.length === 0 ? (
          <p className="text-sm text-ink-3 text-center py-4">
            Nothing open right now
          </p>
        ) : (
          <div className="space-y-1">
            {mine.map(c => (
              <Row key={c.id} commitment={c} mine onOpen={onOpen} />
            ))}
          </div>
        )}

        {others.length > 0 && (
          <div className="mt-3 border-t border-line pt-2">
            <button
              type="button"
              onClick={() => setShowOthers(v => !v)}
              aria-expanded={showOthers}
              className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left text-xs text-ink-3 hover:bg-surface-2 hover:text-ink-2"
              data-testid="portal-also-on-profile"
            >
              {showOthers ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Also on this profile
              <span className="ml-auto tabular-nums text-ink-4">
                {others.length}
              </span>
            </button>
            {showOthers && (
              <div className="mt-1 space-y-1">
                {others.map(c => (
                  <Row key={c.id} commitment={c} mine={false} onOpen={onOpen} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Row({
  commitment,
  mine,
  onOpen,
}: {
  commitment: Commitment
  mine: boolean
  onOpen?: (commitment: Commitment) => void
}) {
  const isOverdue =
    !!commitment.target_date && isPastDate(commitment.target_date)
  const priority = priorityInfo(commitment.priority)
  const Wrapper: 'button' | 'div' = onOpen ? 'button' : 'div'
  return (
    <Wrapper
      {...(onOpen ? { type: 'button', onClick: () => onOpen(commitment) } : {})}
      className={cn(
        'flex w-full items-start gap-2.5 rounded-md px-1 py-1.5 text-left',
        onOpen && 'hover:bg-surface-2',
      )}
      data-testid="portal-commitment-row"
      data-mine={mine}
      data-commitment={commitment.id}
    >
      <div className="flex-shrink-0 mt-0.5">
        {commitment.status === 'in_progress' ? (
          <PlayCircle className="h-4 w-4 text-ds-accent" />
        ) : (
          <Circle className="h-4 w-4 text-ink-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            mine ? 'text-ink' : 'text-ink-2',
          )}
        >
          {commitment.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {!mine && <AssigneeChip commitment={commitment} size="xs" />}
          <span
            className={cn(
              'inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium',
              TONE_CLASS[priority.tone],
            )}
          >
            {priority.label}
          </span>
          {commitment.type && commitment.type !== 'commitment' && (
            <span className="text-[10px] text-ink-3 ">
              {commitmentTypeLabels[commitment.type] || commitment.type}
            </span>
          )}
          {commitment.target_date && (
            <span
              className={cn(
                'text-xs flex items-center gap-1',
                isOverdue ? 'text-vermillion font-medium' : 'text-ink-3',
              )}
            >
              {isOverdue && <AlertCircle className="h-3 w-3" />}
              {formatDateOnly(commitment.target_date, 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </Wrapper>
  )
}
