'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { WindowChip } from '@/components/sandboxes/window-chip'
import { useSandboxOutcomes } from '@/hooks/queries/use-sandboxes'
import { TONE_CLASS, TONE_DOT } from '@/lib/sandbox/delivery'
import { COACHEE_STATE_LABEL, coacheeStateTone } from '@/lib/sandbox/outcomes'
import { cn } from '@/lib/utils'
import type { SandboxOverview } from '@/types/sandbox'
import type { CoacheeOutcomes } from '@/types/sandbox-outcomes'
import { OutcomeList } from './outcome-list'

export function CoacheeStateChip({
  state,
}: {
  state: CoacheeOutcomes['state']
}) {
  const tone = coacheeStateTone(state)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        TONE_CLASS[tone],
      )}
      data-testid="coachee-outcome-state"
      data-state={state}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[tone])}
        aria-hidden
      />
      {COACHEE_STATE_LABEL[state]}
    </span>
  )
}

interface DeepLink {
  outcome: string | null
  comment: string | null
}

/**
 * `?outcome=<id>[&comment=<id>]#outcomes` — the bell's link to a comment on
 * an outcome — opens that thread and rings the comment. Read from the URL
 * directly (no useSearchParams, so the page keeps its static shell).
 */
function useOutcomeDeepLink(): DeepLink {
  const [link, setLink] = useState<DeepLink>({ outcome: null, comment: null })
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const outcome = params.get('outcome')
    if (outcome) setLink({ outcome, comment: params.get('comment') })
    if (window.location.hash === '#outcomes') {
      document.getElementById('outcomes')?.scrollIntoView({ block: 'start' })
    }
  }, [])
  return link
}

function CoacheeBlock({
  sandboxId,
  coachee,
  canReopen,
  maxPerCoachee,
  showGroup,
  deepLink,
}: {
  sandboxId: string
  coachee: CoacheeOutcomes
  canReopen: boolean
  maxPerCoachee: number
  showGroup: boolean
  deepLink: DeepLink
}) {
  return (
    <div
      className="rounded-lg border border-line px-4 pb-3 pt-3"
      data-testid="outcome-coachee"
      data-member={coachee.member_id}
      data-state={coachee.state}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <PersonAvatar name={coachee.name} email={coachee.email} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              <Link
                href={`/sandbox/${sandboxId}/client/${coachee.member_id}`}
                className="hover:text-ds-accent hover:underline"
              >
                {coachee.name || coachee.email}
              </Link>
            </p>
            {showGroup && coachee.group_names.length > 0 && (
              <p className="truncate text-xs text-ink-3">
                {coachee.group_names.join(' · ')}
              </p>
            )}
          </div>
        </div>
        <CoacheeStateChip state={coachee.state} />
      </div>
      <OutcomeList
        className="mt-1"
        sandboxId={sandboxId}
        coachee={coachee}
        canReopen={canReopen}
        maxPerCoachee={maxPerCoachee}
        openCommentsFor={deepLink.outcome}
        highlightCommentId={deepLink.comment}
      />
    </div>
  )
}

/**
 * Gold sealing, per coachee the viewer may see. Everyone reads it; the
 * buttons are whatever each viewer may do for each coachee.
 */
export function OutcomesPanel({ overview }: { overview: SandboxOverview }) {
  const view = useSandboxView()
  const { data, isLoading, isError } = useSandboxOutcomes(overview.sandbox.id)
  const coachees = data?.coachees ?? []
  const totals = data?.totals
  const showGroup = overview.groups.length > 1
  const deepLink = useOutcomeDeepLink()

  return (
    <section
      id="outcomes"
      className="scroll-mt-20 rounded-xl border border-line bg-paper"
      data-testid="outcomes-panel"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink">
          Outcomes{' '}
          {totals && totals.coachees > 0 && (
            <span
              className="ml-1 text-sm font-normal text-ink-3"
              data-testid="outcomes-summary"
            >
              {totals.sealed} of {totals.coachees} gold sealed
              {totals.proposed > 0 && ` · ${totals.proposed} waiting`}
            </span>
          )}
        </h2>
        {data?.window && <WindowChip event={data.window} today={data.today} />}
      </header>
      {!view.can.seeAllGroups && (
        <p className="border-b border-line px-5 py-2 text-xs text-ink-3">
          {view.scope === 'self'
            ? 'Your outcomes. Propose one or two; your approver gives the gold seal.'
            : 'Your groups. Other groups on this sandbox aren’t shown.'}
        </p>
      )}
      <div className="space-y-4 px-5 py-4">
        {isLoading ? (
          <>
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </>
        ) : isError ? (
          <p className="text-sm text-ink-3">Outcomes couldn’t be loaded.</p>
        ) : coachees.length === 0 ? (
          <p className="text-sm text-ink-3" data-testid="outcomes-empty">
            Outcomes are agreed per coachee once groups exist.
          </p>
        ) : (
          coachees.map(c => (
            <CoacheeBlock
              key={c.member_id}
              sandboxId={overview.sandbox.id}
              coachee={c}
              canReopen={!!data?.can_reopen}
              maxPerCoachee={data?.max_per_coachee ?? 2}
              showGroup={showGroup}
              deepLink={deepLink}
            />
          ))
        )}
      </div>
    </section>
  )
}
