'use client'

import Link from 'next/link'
import { Award } from 'lucide-react'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { fmtDay } from '@/lib/sandbox/format'
import { fmtHoursShort, stateTone } from '@/lib/sandbox/delivery'
import { TONE_CLASS, TONE_DOT } from '@/lib/tone'
import { COACHEE_STATE_LABEL, coacheeStateTone } from '@/lib/sandbox/outcomes'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'
import { cn } from '@/lib/utils'
import { paceGap } from './client-view-copy'
import { PaceRing } from './pace-ring'
import type { ClientPerson } from './client-view-model'

/**
 * One coachee: the dial says how many sessions have happened against the
 * contract, with a notch for where the pace should be today; the footer says
 * where their outcome stands and when they last met their coach.
 */
export function PersonCard({
  person,
  sandboxId,
}: {
  person: ClientPerson
  sandboxId: string
}) {
  const expected = person.pace.expected_sessions
  const delivered = person.delivered.sessions
  const tone = stateTone(person.pace.state)
  const outcomeState = person.outcomes?.state ?? 'none'
  const outcomeTone = coacheeStateTone(outcomeState)
  const sealed =
    person.outcomes?.outcomes.filter(o => o.status === 'sealed').length ?? 0

  return (
    <article
      className="flex min-w-0 flex-col rounded-xl border border-line bg-paper p-4"
      data-testid="person-card"
      data-member={person.member_id}
      data-state={person.pace.state}
    >
      <header className="flex min-w-0 items-center gap-2.5">
        <PersonAvatar name={person.name} email={person.email} size="md" />
        <div className="min-w-0">
          <Link
            href={sandboxEntityHref(sandboxId, 'client', person.member_id)}
            className="block truncate text-sm font-semibold text-ink hover:text-ds-accent hover:underline"
          >
            {person.name || person.email}
          </Link>
          <p className="truncate text-xs text-ink-3">
            {person.groupName}
            {person.coachNames.length > 0 &&
              ` · ${person.coachNames.join(', ')}`}
          </p>
        </div>
      </header>

      <div className="mt-4 flex min-w-0 items-center gap-4">
        <PaceRing
          size={64}
          width={7}
          value={expected ? delivered / expected : 0}
          expected={
            expected &&
            person.pace.expected_by_today != null &&
            person.pace.state !== 'not_started'
              ? person.pace.expected_by_today / expected
              : null
          }
          tone={tone === 'default' ? 'muted' : tone}
          label={`${delivered}${expected ? ` of ${expected}` : ''} sessions`}
        >
          <b className="text-base font-semibold tabular-nums text-ink">
            {delivered}
          </b>
          <span className="text-[10px] text-ink-3">
            {expected ? `of ${expected}` : 'sessions'}
          </span>
        </PaceRing>
        <div className="min-w-0 space-y-1">
          <PaceChip pace={person.pace} />
          <p className="truncate text-xs text-ink-2">{paceGap(person.pace)}</p>
          <p className="truncate text-xs tabular-nums text-ink-3">
            {fmtHoursShort(person.delivered.hours)}
            {person.pace.hours_promised != null &&
              ` of ${fmtHoursShort(person.pace.hours_promised)}`}
          </p>
        </div>
      </div>

      <footer className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
            TONE_CLASS[outcomeTone],
          )}
          data-testid="person-outcome"
          data-state={outcomeState}
        >
          {outcomeState === 'sealed' ? (
            <Award className="h-3 w-3" aria-hidden />
          ) : (
            <span
              className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[outcomeTone])}
              aria-hidden
            />
          )}
          {COACHEE_STATE_LABEL[outcomeState]}
        </span>
        {sealed > 1 && (
          <span className="text-xs text-ink-3">{sealed} sealed</span>
        )}
        <span className="ml-auto text-xs text-ink-3">
          {person.delivered.last_on
            ? `Last ${fmtDay(person.delivered.last_on)}`
            : 'No session yet'}
        </span>
      </footer>
    </article>
  )
}
