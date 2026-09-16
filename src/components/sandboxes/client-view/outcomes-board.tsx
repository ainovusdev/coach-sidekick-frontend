'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { OutcomeList } from '@/components/sandboxes/outcomes/outcome-list'
import { CoacheeStateChip } from '@/components/sandboxes/outcomes/outcomes-panel'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'
import { sealingLine } from './client-view-copy'
import { OutcomeStateBar, OutcomeStateLegend } from './scorecards'
import { Empty } from '@/components/sandboxes/section'
import type { ClientViewModel } from './client-view-model'

interface DeepLink {
  outcome: string | null
  comment: string | null
}

/**
 * `?outcome=<id>[&comment=<id>]#outcomes` — the bell's link to a comment on an
 * outcome — opens that thread and rings the comment.
 */
function useOutcomeDeepLink(): DeepLink {
  const [link, setLink] = useState<DeepLink>({ outcome: null, comment: null })
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const outcome = params.get('outcome')
    if (outcome) setLink({ outcome, comment: params.get('comment') })
  }, [])
  return link
}

/**
 * Where every coachee's outcome stands, and — for whoever approves them — the
 * buttons to decide. The rows are the cockpit's `OutcomeList`, so a seal from
 * here is the same action, with the same comment thread, as a seal anywhere
 * else in the product.
 */
export function OutcomesBoard({
  model,
  sandboxId,
  loading,
}: {
  model: ClientViewModel
  sandboxId: string
  loading: boolean
}) {
  const deepLink = useOutcomeDeepLink()
  const data = model.outcomes
  const coachees = data?.coachees ?? []
  const showGroup = model.groups.length > 1

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <OutcomeStateBar totals={model.outcomeTotals} />
        <OutcomeStateLegend totals={model.outcomeTotals} />
        <p className="text-xs text-ink-3" data-testid="sealing-line">
          {sealingLine(
            data?.window ?? null,
            model.waitingForSeal,
            model.sentBack,
          )}
        </p>
      </div>

      {loading && !data ? (
        <>
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </>
      ) : coachees.length === 0 ? (
        <Empty>Outcomes are agreed per coachee once groups exist.</Empty>
      ) : (
        <div className="space-y-3">
          {coachees.map(c => (
            <div
              key={c.member_id}
              className="rounded-lg border border-line px-4 py-3"
              data-testid="outcome-coachee"
              data-member={c.member_id}
              data-state={c.state}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <PersonAvatar name={c.name} email={c.email} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      <Link
                        href={sandboxEntityHref(
                          sandboxId,
                          'client',
                          c.member_id,
                        )}
                        className="hover:text-ds-accent hover:underline"
                      >
                        {c.name || c.email}
                      </Link>
                    </p>
                    {/* Who approves is said once, by the list's own footer. */}
                    <p className="truncate text-xs text-ink-3">
                      {showGroup && c.group_names.length > 0 && (
                        <>{c.group_names.join(' · ')}</>
                      )}
                      {c.can_approve && (
                        <>
                          {showGroup && c.group_names.length > 0 && ' · '}
                          You give the gold seal
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <CoacheeStateChip state={c.state} />
              </div>
              <OutcomeList
                className="mt-1"
                sandboxId={sandboxId}
                coachee={c}
                canReopen={!!data?.can_reopen}
                maxPerCoachee={data?.max_per_coachee ?? 2}
                openCommentsFor={deepLink.outcome}
                highlightCommentId={deepLink.comment}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
