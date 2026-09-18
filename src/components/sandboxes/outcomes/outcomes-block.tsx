'use client'

import { CoacheeStateChip } from './outcomes-panel'
import { OutcomeList } from './outcome-list'
import type { ClientSandboxContext } from '@/types/sandbox-delivery'
import type { CoacheeOutcomes } from '@/types/sandbox-outcomes'

/**
 * The outcomes block on the two cards (coach's client profile, coachee's
 * portal). Same list as the cockpit panel, built from the context response.
 */
export function OutcomesBlock({
  ctx,
  coacheeName,
}: {
  ctx: ClientSandboxContext
  coacheeName: string
}) {
  if (!ctx.member_id) return null
  const coachee: CoacheeOutcomes = {
    member_id: ctx.member_id,
    user_id: '',
    name: coacheeName,
    email: '',
    group_ids: [ctx.group_id],
    group_names: [ctx.group_name],
    approver_names: ctx.approver_names,
    can_propose: ctx.can_propose,
    can_approve: ctx.can_approve,
    state: ctx.outcome_state,
    outcomes: ctx.outcomes,
  }
  return (
    <div
      className="mt-4 border-t border-line pt-3"
      data-testid="outcomes-block"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          Outcomes
        </p>
        <CoacheeStateChip state={ctx.outcome_state} />
      </div>
      <OutcomeList sandboxId={ctx.sandbox_id} coachee={coachee} />
    </div>
  )
}
