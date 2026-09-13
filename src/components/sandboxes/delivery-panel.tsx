'use client'

import Link from 'next/link'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { useSandboxDelivery } from '@/hooks/queries/use-sandboxes'
import {
  fmtHoursShort,
  NO_CONTRACT_COPY,
  stateTone,
} from '@/lib/sandbox/delivery'
import { fmtDay, listNames, pluralise } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { SandboxOverview } from '@/types/sandbox'
import type { CoacheeDelivery, GroupDelivery } from '@/types/sandbox-delivery'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'

function contractLine(g: GroupDelivery): string {
  if (g.hours_per_coachee == null) return 'Hours per coachee not set'
  const hours = fmtHoursShort(g.hours_per_coachee)
  const base = `${hours} at ${g.session_length_minutes} min → ${pluralise(g.expected_sessions ?? 0, 'session')}`
  return g.cadence_text ? `${base} · ${g.cadence_text}` : base
}

function lastAndNext(c: CoacheeDelivery): string {
  const parts: string[] = []
  if (c.delivered.in_flight > 0) parts.push('In a session now')
  if (c.delivered.last_on) parts.push(`Last ${fmtDay(c.delivered.last_on)}`)
  if (c.delivered.next_scheduled_on)
    parts.push(`Next ${fmtDay(c.delivered.next_scheduled_on)}`)
  else if (c.delivered.sessions > 0) parts.push('Nothing scheduled')
  return parts.join(' · ')
}

function CoacheeRow({
  c,
  g,
  sandboxId,
}: {
  c: CoacheeDelivery
  g: GroupDelivery
  sandboxId: string
}) {
  return (
    <li
      className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5"
      data-testid="delivery-coachee"
      data-email={c.email}
      data-state={c.pace.state}
    >
      <PersonAvatar name={c.name} email={c.email} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          <Link
            href={sandboxEntityHref(sandboxId, 'client', c.member_id)}
            className="hover:text-ds-accent hover:underline"
          >
            {c.name || c.email}
          </Link>
        </p>
        <p className="truncate text-xs text-ink-3">
          {c.pace.state === 'unknown'
            ? `${pluralise(c.delivered.sessions, 'session')} · ${fmtHoursShort(c.delivered.hours)} so far`
            : c.pace.sentence}
        </p>
      </div>
      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
        <span className="text-xs text-ink-3">{lastAndNext(c)}</span>
        <PaceChip pace={c.pace} startsOn={g.starts_on} />
      </div>
    </li>
  )
}

function GroupBlock({
  g,
  today,
  sandboxId,
}: {
  g: GroupDelivery
  today: string
  sandboxId: string
}) {
  const expectedTotal = g.expected_total ?? 0
  const byToday =
    g.expected_sessions != null
      ? g.coachees.reduce((sum, c) => sum + (c.pace.expected_by_today ?? 0), 0)
      : null
  const tone = stateTone(g.state)
  return (
    <div
      className="rounded-lg border border-line"
      data-testid="delivery-group"
      data-group={g.group_id}
      data-state={g.state}
    >
      <div className="px-4 pt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-sm font-semibold text-ink">
            <Link
              href={sandboxEntityHref(sandboxId, 'group', g.group_id)}
              className="hover:text-ds-accent hover:underline"
            >
              {g.display_name}
            </Link>
          </h3>
          <span className="text-xs text-ink-3">
            {g.coach_names.length > 0 &&
              `Coached by ${listNames(g.coach_names, 2)} · `}
            starts {fmtDay(g.starts_on)}
          </span>
        </div>
        <p className="mt-0.5 font-mono text-[11px] text-ink-3">
          {contractLine(g)}
        </p>
        {g.expected_sessions != null ? (
          <ProgressRail
            className="mt-3"
            value={g.delivered_sessions}
            max={expectedTotal}
            marker={byToday}
            markerLabel={
              byToday != null
                ? `About ${Math.round(byToday)} expected by ${fmtDay(today)}`
                : undefined
            }
            tone={
              tone === 'danger'
                ? 'danger'
                : tone === 'warning'
                  ? 'warning'
                  : 'ink'
            }
            captions={[
              `${g.delivered_sessions} of ${expectedTotal} sessions`,
              byToday != null
                ? `about ${Math.round(byToday)} expected by now`
                : '',
              g.coachees.length === 1
                ? ''
                : pluralise(g.coachees.length, 'coachee'),
            ]}
          />
        ) : (
          <p
            className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-xs text-ink-3"
            data-testid="delivery-no-contract"
          >
            {NO_CONTRACT_COPY}
          </p>
        )}
      </div>
      <ul className="mt-2 divide-y divide-line border-t border-line px-4">
        {g.coachees.map(c => (
          <CoacheeRow key={c.member_id} c={c} g={g} sandboxId={sandboxId} />
        ))}
        {g.coachees.length === 0 && (
          <li className="py-2.5 text-xs text-ink-3">
            No coachees in this group yet.
          </li>
        )}
      </ul>
    </div>
  )
}

/**
 * Delivered vs expected per coachee, for the groups the viewer may see.
 * Derived from sessions on the server; nothing to edit here.
 */
export function DeliveryPanel({ overview }: { overview: SandboxOverview }) {
  const view = useSandboxView()
  const { data, isLoading, isError } = useSandboxDelivery(overview.sandbox.id)
  const groups = data?.groups ?? []
  const totals = data?.totals

  return (
    <section
      id="delivery"
      className="scroll-mt-20 rounded-xl border border-line bg-paper"
      data-testid="delivery-panel"
      data-state={data?.state}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink">
          Delivery{' '}
          {totals && (
            <span className="ml-1 text-sm font-normal text-ink-3">
              {totals.expected_sessions != null
                ? `${totals.delivered_sessions} of ${totals.expected_sessions} sessions`
                : pluralise(totals.delivered_sessions, 'session')}
              {totals.hours_promised != null &&
                ` · ${fmtHoursShort(totals.hours_delivered)} of ${fmtHoursShort(totals.hours_promised)}`}
            </span>
          )}
        </h2>
        {totals && (totals.behind > 0 || totals.not_started > 0) && (
          <span className="text-xs text-ink-3" data-testid="delivery-summary">
            {[
              totals.behind > 0 && `${totals.behind} behind`,
              totals.not_started > 0 && `${totals.not_started} not started`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        )}
      </header>

      {!view.can.seeAllGroups && (
        <p className="border-b border-line px-5 py-2 text-xs text-ink-3">
          {view.scope === 'self'
            ? 'Your own coaching.'
            : 'Your groups. Other groups on this sandbox aren’t shown.'}
        </p>
      )}

      <div className={cn('space-y-4 px-5 py-4')}>
        {isLoading ? (
          <>
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </>
        ) : isError ? (
          <p className="text-sm text-ink-3">Delivery couldn’t be loaded.</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-ink-3" data-testid="delivery-empty">
            Sessions show up here once a group exists.
          </p>
        ) : (
          groups.map(g => (
            <GroupBlock
              key={g.group_id}
              g={g}
              today={data!.today}
              sandboxId={overview.sandbox.id}
            />
          ))
        )}
      </div>
    </section>
  )
}
