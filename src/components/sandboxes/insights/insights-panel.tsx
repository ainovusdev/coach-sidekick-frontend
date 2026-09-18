'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import { Section } from '@/components/sandboxes/section'
import { LearningPanel } from './learning-panel'
import { DeliverySummary } from './delivery-summary'
import {
  fmtHoursShort,
  NO_CONTRACT_COPY,
  STATE_LABEL,
  stateTone,
} from '@/lib/sandbox/delivery'
import { fmtDay, listNames, pluralise } from '@/lib/sandbox/format'
import type { SandboxGroup, SandboxOverview } from '@/types/sandbox'
import type { CoacheeDelivery } from '@/types/sandbox-delivery'
import type {
  InsightSelection,
  SandboxAnalytics,
} from '@/types/sandbox-analytics'
import type { SandboxReporting } from '@/hooks/queries/use-sandbox-insights'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'

const control =
  'rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-ds-accent'
const cell = 'px-3 py-3 text-left text-sm'

function DeliveryChart({ data }: { data: SandboxAnalytics }) {
  const [cumulative, setCumulative] = useState(true)
  return (
    <Section
      id="delivery-over-time"
      title="Delivery over time"
      className="min-w-0"
      bodyClassName="space-y-4"
      note={`${fmtHoursShort(data.metrics.hours_received)} received in this period. The solid line shows recorded delivery; the dashed line shows expected contract hours.`}
      aside={
        <label className="text-xs text-ink-3">
          Chart view{' '}
          <select
            className={control}
            value={cumulative ? 'cumulative' : 'weekly'}
            onChange={e => setCumulative(e.target.value === 'cumulative')}
          >
            <option value="cumulative">Cumulative hours</option>
            <option value="weekly">Weekly hours</option>
          </select>
        </label>
      }
    >
      {data.dates.available && data.weekly_series.length > 0 ? (
        <div
          className="h-72 w-full min-w-0 overflow-hidden"
          role="img"
          aria-label={`${cumulative ? 'Cumulative' : 'Weekly'} coaching hours received and expected. The data table follows.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.weekly_series}
              margin={{ top: 8, right: 12, bottom: 0, left: -20 }}
              accessibilityLayer
            >
              <CartesianGrid
                stroke="var(--line)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="starts_on"
                tickFormatter={value => fmtDay(value)}
                stroke="var(--ink-3)"
                tick={{ fontSize: 11 }}
                minTickGap={36}
              />
              <YAxis stroke="var(--ink-3)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--paper)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)',
                  borderRadius: 8,
                }}
                labelFormatter={value =>
                  `Week of ${fmtDay(String(value), true)}`
                }
                formatter={value => fmtHoursShort(Number(value))}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="linear"
                dataKey={
                  cumulative ? 'cumulative_hours_received' : 'hours_received'
                }
                name="Hours received"
                stroke="var(--ds-accent)"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey={
                  cumulative ? 'cumulative_expected_hours' : 'expected_hours'
                }
                name="Expected hours"
                stroke="var(--ink-3)"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-ink-3">
          A delivery chart is unavailable until reporting dates are set.
        </p>
      )}
      <details>
        <summary className="cursor-pointer text-sm text-ink-2 underline underline-offset-4">
          View chart data table
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">
              Weekly and cumulative coaching hours in the selected period
            </caption>
            <thead>
              <tr>
                {[
                  'Week',
                  'Received',
                  'Expected',
                  'Cumulative received',
                  'Cumulative expected',
                ].map(label => (
                  <th key={label} className={cell}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.weekly_series.map(row => (
                <tr key={row.starts_on} className="border-t border-line">
                  <th className={cell}>
                    {fmtDay(row.starts_on)} – {fmtDay(row.ends_on)}
                  </th>
                  {[
                    row.hours_received,
                    row.expected_hours,
                    row.cumulative_hours_received,
                    row.cumulative_expected_hours,
                  ].map((value, index) => (
                    <td key={index} className={cell}>
                      {value == null ? 'Unavailable' : fmtHoursShort(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Section>
  )
}

/** "18 h at 60 min → 18 sessions · fortnightly" — what the group was sold. */
function contractLine(g: SandboxGroup): string {
  if (g.hours_per_coachee == null) return 'Hours per coachee not set'
  const base = `${fmtHoursShort(g.hours_per_coachee)} at ${g.session_length_minutes} min → ${pluralise(g.expected_sessions ?? 0, 'session')}`
  return g.cadence_text ? `${base} · ${g.cadence_text}` : base
}

/** "In a session now · Last 3 Oct · Next 17 Oct" */
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
  sandboxId,
  startsOn,
}: {
  c: CoacheeDelivery
  sandboxId: string
  startsOn: string | null
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
            : `${c.pace.sentence} · ${fmtHoursShort(c.delivered.hours)} received`}
        </p>
      </div>
      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
        <span className="whitespace-nowrap text-xs text-ink-3">
          {lastAndNext(c)}
        </span>
        <PaceChip pace={c.pace} startsOn={startsOn} />
      </div>
    </li>
  )
}

/**
 * One group, opened: the contract it was sold on, how far through it is, and
 * every coachee inside it.
 *
 * Read from `/analytics`, which carries each group's coachees and their pace
 * already — but not the contract itself, so the hours, the session length, the
 * cadence and the coach names come from the overview that is already in memory,
 * matched on `group_id`. Two clocks run here and the note above says so: the
 * sessions and hours at the top are for the selected period, everything about
 * the contract is to date.
 */
function GroupBlock({
  group,
  contract,
  sandboxId,
  today,
}: {
  group: SandboxAnalytics['groups'][number]
  contract: SandboxGroup | undefined
  sandboxId: string
  today: string
}) {
  // The contract is "known" when the group has a target at all — an empty
  // group or one with no hours set reads unknown, never a confident zero.
  const known = contract?.expected_sessions != null
  const delivered = group.coachees.reduce(
    (n, c) => n + c.pace.delivered_sessions,
    0,
  )
  const expected = group.coachees.reduce(
    (n, c) => n + (c.pace.expected_sessions ?? 0),
    0,
  )
  const byToday = known
    ? group.coachees.reduce((n, c) => n + (c.pace.expected_by_today ?? 0), 0)
    : null
  const tone = stateTone(group.state)
  const coachNames = (contract?.coaches ?? []).map(c => c.name || c.email)

  return (
    <details
      className="rounded-lg border border-line px-4 py-3"
      data-testid="analytics-group"
      data-group={group.group_id}
      data-state={group.state}
    >
      <summary className="cursor-pointer text-sm text-ink marker:text-ink-4">
        <span className="inline-flex flex-wrap items-baseline gap-x-2">
          <Link
            href={sandboxEntityHref(sandboxId, 'group', group.group_id)}
            className="font-medium hover:text-ds-accent hover:underline"
          >
            {group.display_name}
          </Link>
          <span className="text-xs text-ink-3">{STATE_LABEL[group.state]}</span>
        </span>
        <span className="mt-1 block font-mono text-[11px] text-ink-3">
          {contract ? contractLine(contract) : 'Contract unavailable'}
          {coachNames.length > 0 && ` · ${listNames(coachNames, 2)}`}
          {contract && ` · starts ${fmtDay(contract.starts_on)}`}
        </span>
        <span className="mt-2 grid grid-cols-2 gap-2 text-xs text-ink-2 sm:grid-cols-4">
          <span>{group.sessions_held} sessions held</span>
          <span>
            {fmtHoursShort(group.hours_received)} received /{' '}
            {group.hours_promised == null
              ? 'unavailable'
              : fmtHoursShort(group.hours_promised)}{' '}
            promised
          </span>
          <span>
            {group.coachees_on_track.count} / {group.coachees_on_track.total} on
            track
          </span>
          <span>{group.yet_to_start} yet to start</span>
        </span>
        {known ? (
          <ProgressRail
            className="mt-3"
            value={delivered}
            max={expected}
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
              `${delivered} of ${expected} sessions`,
              byToday != null
                ? `about ${Math.round(byToday)} expected by now`
                : '',
              group.coachees.length === 1
                ? ''
                : pluralise(group.coachees.length, 'coachee'),
            ]}
          />
        ) : (
          <span
            className="mt-3 block rounded-md bg-surface-2 px-3 py-2 text-xs text-ink-3"
            data-testid="delivery-no-contract"
          >
            {NO_CONTRACT_COPY}
          </span>
        )}
        <span className="mt-2 block text-xs text-ink-3">
          Last:{' '}
          {group.last_activity_on
            ? fmtDay(group.last_activity_on)
            : 'None recorded'}{' '}
          · Next:{' '}
          {group.next_activity_on
            ? fmtDay(group.next_activity_on)
            : 'None scheduled'}
        </span>
      </summary>
      <ul className="mt-3 divide-y divide-line border-t border-line">
        {group.coachees.map(c => (
          <CoacheeRow
            key={c.member_id}
            c={c}
            sandboxId={sandboxId}
            startsOn={contract?.starts_on ?? null}
          />
        ))}
        {group.coachees.length === 0 && (
          <li className="py-2.5 text-xs text-ink-3">
            No coachees in this group yet.
          </li>
        )}
      </ul>
    </details>
  )
}

/**
 * Where the delivery actually is, group by group and coachee by coachee.
 *
 * This is the only place per-coachee delivery is rendered. It used to be two
 * panels reading two endpoints — one of which could not honour the period
 * selector at all — saying much the same thing in two visual languages.
 */
function Comparisons({
  data,
  groups,
  today,
}: {
  data: SandboxAnalytics
  groups: SandboxGroup[]
  today: string
}) {
  const [mode, setMode] = useState('groups')
  // A coachee's own page has one person on it and no one to compare them with,
  // but they still get their group and their own rows.
  const personal = data.presentation_mode === 'personal'
  const byId = new Map(groups.map(g => [g.id, g]))
  const showCoaches = !personal && mode === 'coaches'

  const everyone = data.groups.flatMap(g => g.coachees)
  const behind = everyone.filter(c => c.pace.state === 'behind').length
  const notStarted = everyone.filter(c => c.pace.state === 'not_started').length

  return (
    <Section
      id="delivery"
      title={showCoaches ? 'Activity by coach' : 'Delivery by group'}
      testId="delivery-panel"
      dataState={data.current_contract.state}
      sub={
        behind + notStarted > 0
          ? [
              behind > 0 && `${behind} behind`,
              notStarted > 0 && `${notStarted} not started`,
            ]
              .filter(Boolean)
              .join(' · ')
          : undefined
      }
      note={
        showCoaches
          ? 'Recorded activity in the selected period, not a quality ranking.'
          : 'Sessions and received hours are for the selected period. The contract, the pace and the people yet to start are to date.'
      }
      bodyClassName="space-y-3"
      aside={
        !personal && (
          <label className="text-xs text-ink-3">
            Compare{' '}
            <select
              className={control}
              value={mode}
              onChange={e => setMode(e.target.value)}
            >
              <option value="groups">Groups</option>
              <option value="coaches">Coaches</option>
            </select>
          </label>
        )
      }
    >
      {showCoaches ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">Coach activity</caption>
            <thead>
              <tr>
                {['Coach', 'Sessions held', 'Coachees reached'].map(label => (
                  <th className={cell} key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.coaches.map(coach => (
                <tr key={coach.user_id} className="border-t border-line">
                  <th className={cell}>
                    <Link
                      href={sandboxEntityHref(
                        data.sandbox_id,
                        'coach',
                        coach.user_id,
                      )}
                      className="hover:text-ds-accent hover:underline"
                    >
                      {coach.name}
                    </Link>
                  </th>
                  <td className={cell}>{coach.sessions_held}</td>
                  <td className={cell}>{coach.coachees_reached}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : data.groups.length ? (
        data.groups.map(group => (
          <GroupBlock
            key={group.group_id}
            group={group}
            contract={byId.get(group.group_id)}
            sandboxId={data.sandbox_id}
            today={today}
          />
        ))
      ) : (
        <p className="text-sm text-ink-3" data-testid="delivery-empty">
          No groups available in this selection.
        </p>
      )}
    </Section>
  )
}

/**
 * Delivery and learning — the reporting tab.
 *
 * `#insights` is the anchor this surface has always had and `#delivery` is the
 * one the per-group panel had; both land here, so both keep working.
 */
export function InsightsPanel({
  overview,
  reporting,
  selection,
  onSelection,
  onNavigate,
}: {
  overview: SandboxOverview
  reporting: SandboxReporting
  selection: InsightSelection
  onSelection: (selection: InsightSelection) => void
  onNavigate: (anchor: string) => void
}) {
  const data = reporting.analytics
  return (
    <div
      id="insights"
      className="min-w-0 scroll-mt-(--section-offset) space-y-4"
      data-testid="insights-panel"
    >
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 rounded-xl border border-line bg-paper px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">
            {data?.presentation_mode === 'personal'
              ? 'Your coaching and learning'
              : 'Delivery and learning'}
          </h2>
          {data && (
            <p className="mt-0.5 max-w-prose text-xs text-ink-3">
              {data.dates.available &&
              data.dates.starts_on &&
              data.dates.ends_on
                ? `${fmtDay(data.dates.starts_on, true)} – ${fmtDay(data.dates.ends_on, true)}`
                : 'Reporting dates unavailable'}
              . Filters change delivery activity and learning together; they do
              not generate insights.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="space-y-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            <span className="block">Reporting period</span>
            <select
              aria-label="Reporting period"
              className={control}
              value={selection.period}
              onChange={e =>
                onSelection({
                  ...selection,
                  period: e.target.value as InsightSelection['period'],
                })
              }
            >
              <option value="term">Contract to date</option>
              <option value="90d">Last 90 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </label>
          <label className="min-w-0 max-w-full space-y-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            <span className="block">Group</span>
            <select
              aria-label="Reporting group"
              className={`${control} max-w-full`}
              value={selection.group_id ?? ''}
              onChange={e =>
                onSelection({ ...selection, group_id: e.target.value || null })
              }
            >
              <option value="">All accessible groups</option>
              {data?.available_groups.map(group => (
                <option key={group.group_id} value={group.group_id}>
                  {group.display_name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      {reporting.error && (
        <p role="alert" className="text-sm text-ink-2">
          This reporting selection could not be loaded. It may no longer be
          accessible.{' '}
          <Button variant="outline" size="sm" onClick={reporting.retry}>
            Try again
          </Button>
        </p>
      )}
      {!data && !reporting.error && (
        <p role="status" className="text-sm text-ink-3">
          Loading delivery…
        </p>
      )}
      {data && (
        <>
          <DeliverySummary data={data} period />
          <DeliveryChart data={data} />
          <Comparisons
            data={data}
            groups={overview.groups}
            today={overview.today}
          />
          <Section id="upcoming" title="Upcoming in the next 14 days">
            {data.upcoming.length ? (
              <ul className="space-y-2">
                {data.upcoming.map(item => (
                  <li key={item.session_id} className="text-sm text-ink-2">
                    {fmtDay(item.scheduled_on, true)} ·{' '}
                    {item.group_ids
                      .map(
                        id =>
                          data.available_groups.find(
                            group => group.group_id === id,
                          )?.display_name,
                      )
                      .filter(Boolean)
                      .join(', ') || 'Scheduled coaching'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-3">
                No scheduled sessions recorded in the applicable contract
                window.
              </p>
            )}
            <button
              className="mt-3 text-sm text-ds-accent underline-offset-2 hover:underline"
              onClick={() => onNavigate('timeline')}
            >
              View timeline
            </button>
          </Section>
        </>
      )}
      <LearningPanel reporting={reporting} onNavigate={onNavigate} />
      {data && (
        <Section
          id="coverage"
          title="Evidence and coverage"
          bodyClassName="space-y-2 text-xs text-ink-3"
        >
          <p>
            {data.coverage.sessions_with_learning_evidence} of{' '}
            {data.coverage.sessions_held} held sessions have usable learning
            evidence. {data.coverage.sessions_with_estimated_duration} sessions
            use the planned length to estimate duration.
          </p>
          <p>
            {data.coverage.sessions_missing_date} sessions have missing dates.{' '}
            {data.coverage.relationships_missing_hours} coaching relationships
            have no promised hours.
          </p>
          <p>{data.coverage.learning_note}</p>
          <details>
            <summary className="cursor-pointer underline underline-offset-4">
              Metric definitions
            </summary>
            <dl className="mt-3 space-y-3">
              {Object.entries(data.definitions).map(([key, definition]) => (
                <div key={key}>
                  <dt className="font-medium text-ink-2">
                    {key.replaceAll('_', ' ')}
                  </dt>
                  <dd>{definition}</dd>
                </div>
              ))}
            </dl>
          </details>
        </Section>
      )}
    </div>
  )
}
