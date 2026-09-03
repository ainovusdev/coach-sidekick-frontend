'use client'

import { Award, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TONE_CLASS, TONE_DOT } from '@/lib/sandbox/delivery'
import {
  OUTCOME_STATUS_LABEL,
  outcomeMeta,
  outcomeTone,
} from '@/lib/sandbox/outcomes'
import { cn } from '@/lib/utils'
import type { Outcome } from '@/types/sandbox-outcomes'

export function OutcomeStatusChip({
  status,
  className,
}: {
  status: Outcome['status']
  className?: string
}) {
  const tone = outcomeTone(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        TONE_CLASS[tone],
        className,
      )}
      data-testid="outcome-status"
      data-status={status}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[tone])}
        aria-hidden
      />
      {status === 'sealed' && <Award className="h-3 w-3" aria-hidden />}
      {OUTCOME_STATUS_LABEL[status]}
    </span>
  )
}

export interface OutcomeActions {
  onEdit?: (o: Outcome) => void
  onPropose?: (o: Outcome) => void
  onDecide?: (o: Outcome, decision: 'seal' | 'changes') => void
  onReopen?: (o: Outcome) => void
  onDelete?: (o: Outcome) => void
}

/**
 * One outcome: status, the statement, how we'll know, who did the last thing.
 * The buttons are whatever the viewer may do next — nothing else is drawn.
 */
export function OutcomeRow({
  outcome: o,
  canPropose,
  canApprove,
  canReopen,
  actions,
  busy,
}: {
  outcome: Outcome
  canPropose: boolean
  canApprove: boolean
  canReopen: boolean
  actions: OutcomeActions
  busy?: boolean
}) {
  const buttons: React.ReactNode[] = []
  if (canApprove && o.status === 'proposed') {
    buttons.push(
      <Button
        key="seal"
        size="sm"
        onClick={() => actions.onDecide?.(o, 'seal')}
        disabled={busy}
        data-testid="outcome-seal"
      >
        <Award className="h-3.5 w-3.5" /> Gold seal
      </Button>,
      <Button
        key="changes"
        size="sm"
        variant="outline"
        onClick={() => actions.onDecide?.(o, 'changes')}
        disabled={busy}
        data-testid="outcome-changes"
      >
        Request changes
      </Button>,
    )
  }
  if (canPropose && o.status !== 'sealed') {
    if (o.status !== 'proposed') {
      buttons.push(
        <Button
          key="propose"
          size="sm"
          variant={canApprove ? 'outline' : 'default'}
          onClick={() => actions.onPropose?.(o)}
          disabled={busy}
          data-testid="outcome-propose-row"
        >
          {o.status === 'changes_requested' ? 'Propose again' : 'Propose'}
        </Button>,
      )
    }
    buttons.push(
      <Button
        key="edit"
        size="sm"
        variant="ghost"
        onClick={() => actions.onEdit?.(o)}
        disabled={busy}
        aria-label="Edit outcome"
        data-testid="outcome-edit"
      >
        <Pencil className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only">Edit</span>
      </Button>,
      <Button
        key="delete"
        size="sm"
        variant="ghost"
        className="text-ink-3 hover:text-vermillion"
        onClick={() => actions.onDelete?.(o)}
        disabled={busy}
        aria-label="Remove outcome"
        data-testid="outcome-delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>,
    )
  }
  if (canReopen && o.status === 'sealed') {
    buttons.push(
      <Button
        key="reopen"
        size="sm"
        variant="ghost"
        className="text-ink-3"
        onClick={() => actions.onReopen?.(o)}
        disabled={busy}
        data-testid="outcome-reopen"
      >
        Reopen
      </Button>,
    )
  }

  return (
    <li
      className="py-3"
      data-testid="outcome-row"
      data-outcome={o.id}
      data-status={o.status}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <OutcomeStatusChip status={o.status} />
            <span className="text-xs text-ink-3">{outcomeMeta(o)}</span>
          </div>
          <p
            className="mt-1.5 text-sm font-medium text-ink"
            data-testid="outcome-title-text"
          >
            {o.title}
          </p>
          {o.measure && (
            <p className="mt-0.5 text-sm text-ink-2">{o.measure}</p>
          )}
          {o.status === 'changes_requested' && o.decision_note && (
            <p
              className="mt-2 rounded-md border-l-2 border-vermillion bg-vermillion-bg/40 px-3 py-1.5 text-xs text-ink-2"
              data-testid="outcome-note"
            >
              <span className="font-medium text-ink">
                {o.decided_by_name ?? 'The approver'}:
              </span>{' '}
              {o.decision_note}
            </p>
          )}
        </div>
        {buttons.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">{buttons}</div>
        )}
      </div>
    </li>
  )
}
