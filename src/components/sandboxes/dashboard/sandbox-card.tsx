'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { WindowChip } from '@/components/sandboxes/window-chip'
import {
  fmtDay,
  pluralise,
  STATUS_CLASS,
  STATUS_LABEL,
} from '@/lib/sandbox/format'
import {
  stateTone,
  STATE_LABEL,
  TONE_CLASS,
  TONE_DOT,
} from '@/lib/sandbox/delivery'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/types/sandbox'
import type { SandboxCard as SandboxCardData } from '@/types/sandbox-delivery'

/** One coachee → their own pace chip; several → a roll-up chip. */
function CardPaceChip({
  card,
  startsOn,
}: {
  card: SandboxCardData
  startsOn: string
}) {
  const coachees = card.my_groups.flatMap(g => g.coachees)
  // On the coaches list but not paired yet: say so, rather than showing a card
  // that looks like it is missing its numbers.
  if (coachees.length === 0)
    return card.sandbox.my_roles.length === 1 &&
      card.sandbox.my_roles[0] === 'coach' ? (
      <span
        className="inline-flex items-center rounded-full bg-surface-3 px-2 py-0.5 text-xs text-ink-3"
        data-testid="no-pairings-yet"
      >
        No pairings yet
      </span>
    ) : null
  if (coachees.length === 1)
    return <PaceChip pace={coachees[0].pace} startsOn={startsOn} />
  const tone = stateTone(card.delivery_state)
  const head =
    card.expected_sessions != null
      ? `${card.delivered_sessions} of ${card.expected_sessions}`
      : `${card.delivered_sessions} sessions`
  const parts = [
    card.behind_count > 0 && `${card.behind_count} behind`,
    card.not_started_count > 0 && `${card.not_started_count} not started`,
  ].filter(Boolean)
  const tail = parts.length
    ? parts.join(' · ')
    : STATE_LABEL[card.delivery_state].toLowerCase()
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        TONE_CLASS[tone],
      )}
      data-testid="pace-chip"
      data-state={card.delivery_state}
    >
      <span
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[tone])}
        aria-hidden
      />
      <span className="truncate">
        {head} · {tail}
      </span>
    </span>
  )
}

function termLine(card: SandboxCardData): string {
  const s = card.sandbox
  if (s.status === 'upcoming') return `Starts ${fmtDay(s.term_start, true)}`
  if (s.status === 'ended') return `Ended ${fmtDay(s.term_end, true)}`
  return `Month ${card.month_of_term} of ${s.term_months}`
}

export function SandboxCard({
  card,
  today,
  compact = false,
  basePath = '/sandboxes',
}: {
  card: SandboxCardData
  today: string
  compact?: boolean
  basePath?: string
}) {
  const s = card.sandbox
  const window = card.current_events[0] ?? card.next_event
  const startsOn = card.my_groups[0]?.starts_on ?? s.term_start
  return (
    <Link
      href={`${basePath}/${s.id}`}
      className="group flex h-full flex-col rounded-xl border border-line bg-paper p-5 transition-colors hover:border-ink-4"
      data-testid="sandbox-card"
      data-sandbox={s.id}
      data-state={card.delivery_state}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink">
            {s.name}
          </h3>
          <p className="truncate text-sm text-ink-3">{s.organisation}</p>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
            STATUS_CLASS[s.status],
          )}
        >
          {STATUS_LABEL[s.status]}
        </span>
      </div>

      <p className="mt-2 font-mono text-xs text-ink-3">{termLine(card)}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CardPaceChip card={card} startsOn={startsOn} />
        {window && <WindowChip event={window} today={today} />}
      </div>

      {!compact && (
        <p className="mt-3 text-sm text-ink-2">
          {s.my_roles.length
            ? s.my_roles.map(r => ROLE_LABELS[r] ?? r).join(' · ')
            : 'Member'}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-xs text-ink-3">
        <span className="truncate">
          {pluralise(card.coachee_count, 'coachee')}
          {card.behind_count > 0 && ` · ${card.behind_count} behind`}
          {card.not_started_count > 0 &&
            ` · ${card.not_started_count} not started`}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-ink-3 transition-colors group-hover:text-ink">
          {card.attention_count > 0 && (
            <span
              className="rounded-full bg-amber-token-bg px-1.5 py-0.5 text-[11px] font-medium text-amber-token"
              data-testid="card-attention"
            >
              {card.attention_count}
            </span>
          )}
          Open <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}
