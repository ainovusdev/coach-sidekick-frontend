'use client'

import { useState } from 'react'
import { Award, Check, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DecisionDialog,
  type Decision,
} from '@/components/sandboxes/outcomes/decision-dialog'
import { fmtDay } from '@/lib/sandbox/format'
import { fmtWhen } from '@/lib/sandbox/outcomes'
import type { ClientViewModel, NeedsOutcome } from './client-view-model'

/**
 * The only place on the page with buttons: outcomes waiting for this person's
 * gold seal, and commitments handed to them.
 *
 * The decision itself is the cockpit's dialog, so sealing from here and
 * sealing from the Outcomes board are the same action with the same wording.
 */
export function NeedsYou({
  model,
  sandboxId,
  onOpenCommitment,
}: {
  model: ClientViewModel
  sandboxId: string
  onOpenCommitment: (id: string) => void
}) {
  const [deciding, setDeciding] = useState<{
    row: NeedsOutcome
    decision: Decision
  } | null>(null)

  if (!model.needs.length && !model.myCommitments.length)
    return (
      <div
        className="flex items-center gap-2 text-sm text-ink-3"
        data-testid="needs-you-empty"
      >
        <Check className="h-4 w-4 text-forest" aria-hidden />
        Nothing is waiting on you.
      </div>
    )

  return (
    <div className="space-y-3">
      {model.needs.map(row => (
        <div
          key={row.outcome.id}
          className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 rounded-lg border border-line border-l-2 border-l-amber-token bg-surface-1 px-4 py-3"
          data-testid="needs-row"
          data-outcome={row.outcome.id}
        >
          <div className="flex min-w-0 flex-1 gap-3">
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-token-bg text-amber-token"
              aria-hidden
            >
              <Award className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">
                “{row.outcome.title}”
              </p>
              <p className="mt-0.5 text-xs text-ink-3">
                {row.coachee.name || row.coachee.email} · proposed by{' '}
                {row.outcome.proposed_by_name ?? 'the coach'}
                {row.outcome.proposed_at &&
                  `, waiting since ${fmtWhen(row.outcome.proposed_at)}`}
              </p>
              {row.outcome.measure && (
                <p className="mt-1 text-xs text-ink-2">
                  Measure: {row.outcome.measure}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeciding({ row, decision: 'changes' })}
              data-testid="needs-changes"
            >
              <Undo2 className="h-3.5 w-3.5" /> Send back
            </Button>
            <Button
              size="sm"
              onClick={() => setDeciding({ row, decision: 'seal' })}
              data-testid="needs-seal"
            >
              <Award className="h-3.5 w-3.5" /> Gold seal
            </Button>
          </div>
        </div>
      ))}

      {model.myCommitments.map(c => (
        <div
          key={c.id}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-line border-l-2 border-l-ds-accent bg-surface-1 px-4 py-3"
          data-testid="needs-commitment"
          data-id={c.id}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{c.title}</p>
            <p className="text-xs text-ink-3">
              {c.target_date ? `Due ${fmtDay(c.target_date)}` : 'Handed to you'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenCommitment(c.id)}
          >
            Open
          </Button>
        </div>
      ))}

      <DecisionDialog
        outcome={deciding?.row.outcome ?? null}
        decision={deciding?.decision ?? 'seal'}
        onOpenChange={open => !open && setDeciding(null)}
        sandboxId={sandboxId}
        coacheeName={
          deciding
            ? deciding.row.coachee.name || deciding.row.coachee.email
            : ''
        }
      />
    </div>
  )
}
