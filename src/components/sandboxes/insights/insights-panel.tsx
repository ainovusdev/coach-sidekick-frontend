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
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { LearningPanel } from './learning-panel'
import { DeliverySummary } from './delivery-summary'
import { fmtHoursShort, STATE_LABEL } from '@/lib/sandbox/delivery'
import { fmtDay } from '@/lib/sandbox/format'
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
    <section
      className="min-w-0 space-y-4 rounded-xl border border-line bg-paper p-5"
      aria-label="Delivery over time"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Delivery over time</h2>
        <label className="text-sm text-ink-2">
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
      </div>
      <p className="text-sm text-ink-2">
        {fmtHoursShort(data.metrics.hours_received)} received in this period.
        The solid line shows recorded delivery; the dashed line shows expected
        contract hours.
      </p>
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
    </section>
  )
}

function Comparisons({ data }: { data: SandboxAnalytics }) {
  const [mode, setMode] = useState('groups')
  if (data.presentation_mode === 'personal') return null
  return (
    <section
      className="space-y-3 rounded-xl border border-line bg-paper p-5"
      aria-label="Delivery comparisons"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">
          Activity across your scope
        </h2>
        <label className="text-sm text-ink-2">
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
      </div>
      {mode === 'coaches' ? (
        <>
          <p className="text-xs text-ink-3">
            Recorded activity in the selected period, not a quality ranking.
          </p>
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
        </>
      ) : (
        <>
          <p className="text-xs text-ink-3">
            Sessions and received hours are for the selected period. Promised
            hours, pace and people yet to start describe the current contract.
          </p>
          {data.groups.map(group => (
            <details
              key={group.group_id}
              className="border-t border-line py-3"
              data-testid="analytics-group"
            >
              <summary className="cursor-pointer text-sm text-ink">
                <Link
                  href={sandboxEntityHref(
                    data.sandbox_id,
                    'group',
                    group.group_id,
                  )}
                  className="font-medium hover:text-ds-accent hover:underline"
                >
                  {group.display_name}
                </Link>
                <span className="ml-2 text-ink-3">
                  {STATE_LABEL[group.state]}
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
                    {group.coachees_on_track.count} /{' '}
                    {group.coachees_on_track.total} on track
                  </span>
                  <span>{group.yet_to_start} yet to start</span>
                </span>
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
              <ul className="mt-3 space-y-3 border-t border-line pt-3">
                {group.coachees.map(person => (
                  <li
                    key={person.member_id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-2"
                  >
                    <span>
                      {person.name || person.email} ·{' '}
                      {fmtHoursShort(person.delivered.hours)} received to date
                    </span>
                    <PaceChip pace={person.pace} />
                  </li>
                ))}
              </ul>
            </details>
          ))}
          {!data.groups.length && (
            <p className="text-sm text-ink-3">
              No groups available in this selection.
            </p>
          )}
        </>
      )}
    </section>
  )
}

export function InsightsPanel({
  reporting,
  selection,
  onSelection,
  onNavigate,
}: {
  reporting: SandboxReporting
  selection: InsightSelection
  onSelection: (selection: InsightSelection) => void
  onNavigate: (anchor: string) => void
}) {
  const data = reporting.analytics
  return (
    <div
      id="insights"
      className="min-w-0 space-y-6 scroll-mt-24"
      data-testid="insights-panel"
    >
      <header className="space-y-4">
        <h1 className="text-2xl font-semibold text-ink">
          {data?.presentation_mode === 'personal'
            ? 'Your coaching and learning'
            : 'Delivery and learning'}
        </h1>
        <div className="flex flex-wrap gap-3">
          <label className="space-y-1 text-xs text-ink-3">
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
          <label className="min-w-0 max-w-full space-y-1 text-xs text-ink-3">
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
        {data && (
          <p className="text-xs text-ink-3">
            {data.dates.available && data.dates.starts_on && data.dates.ends_on
              ? `${fmtDay(data.dates.starts_on, true)} – ${fmtDay(data.dates.ends_on, true)}`
              : 'Reporting dates unavailable'}
            . Filters change delivery activity and learning together; they do
            not generate insights.
          </p>
        )}
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
          <Comparisons data={data} />
          <section className="space-y-3 rounded-xl border border-line bg-paper p-5">
            <h2 className="text-lg font-semibold text-ink">
              Upcoming in the next 14 days
            </h2>
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
              className="text-sm text-ds-accent underline"
              onClick={() => onNavigate('timeline')}
            >
              View timeline
            </button>
          </section>
        </>
      )}
      <LearningPanel reporting={reporting} onNavigate={onNavigate} />
      {data && (
        <section
          className="space-y-2 border-t border-line pt-4 text-xs text-ink-3"
          aria-label="Data coverage"
        >
          <h2 className="text-sm font-medium text-ink">
            Evidence and coverage
          </h2>
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
        </section>
      )}
    </div>
  )
}
