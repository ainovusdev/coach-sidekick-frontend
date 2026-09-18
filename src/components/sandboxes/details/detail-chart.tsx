'use client'

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
import type { SandboxAnalytics } from '@/types/sandbox-analytics'
import { fmtDay } from '@/lib/sandbox/format'
import { fmtHoursShort } from '@/lib/sandbox/delivery'

export const detailControl =
  'w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-ds-accent'
export const detailSection =
  'min-w-0 rounded-xl border border-line bg-paper p-5 sm:p-6'

export function DetailChart({
  data,
  coach = false,
}: {
  data: SandboxAnalytics
  coach?: boolean
}) {
  const [view, setView] = useState<'cumulative' | 'weekly'>('cumulative')
  const cumulative = view === 'cumulative'
  let sessions = 0
  const series = data.weekly_series.map(row => ({
    ...row,
    cumulative_sessions: (sessions += row.sessions_held ?? 0),
  }))
  return (
    <section
      className={detailSection}
      aria-label={coach ? 'Coach activity over time' : 'Delivery over time'}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            {coach ? 'Coaching activity' : 'Delivery over time'}
          </h2>
          <p className="mt-1 max-w-prose text-sm text-ink-3">
            {coach
              ? `${data.metrics.sessions_held} distinct sessions held in this period.`
              : `${fmtHoursShort(data.metrics.hours_received)} received across ${data.metrics.sessions_held} recorded ${data.metrics.sessions_held === 1 ? 'meeting' : 'meetings'} in this period.`}
          </p>
        </div>
        <label className="text-xs text-ink-3">
          Chart view
          <select
            className={`${detailControl} mt-1`}
            aria-label="Chart view"
            value={view}
            onChange={e => setView(e.target.value as typeof view)}
          >
            <option value="cumulative">
              {coach ? 'Cumulative sessions' : 'Cumulative hours'}
            </option>
            <option value="weekly">
              {coach ? 'Weekly sessions' : 'Weekly hours'}
            </option>
          </select>
        </label>
      </div>
      {data.dates.available && data.weekly_series.length ? (
        <div
          className="mt-6 h-64 min-w-0 overflow-hidden sm:h-72"
          role="img"
          aria-label={`${cumulative ? 'Cumulative' : 'Weekly'} ${coach ? 'sessions held' : 'coaching hours and expected delivery'}. Exact values in the data table below.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={series}
              margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
              accessibilityLayer
            >
              <CartesianGrid
                stroke="var(--line)"
                vertical={false}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="starts_on"
                tickFormatter={value => fmtDay(value)}
                stroke="var(--ink-3)"
                tick={{ fontSize: 11 }}
                minTickGap={42}
              />
              <YAxis stroke="var(--ink-3)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--paper)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)',
                  borderRadius: 8,
                }}
                labelFormatter={v => `Week of ${fmtDay(String(v), true)}`}
                formatter={v =>
                  coach ? `${Number(v)} sessions` : fmtHoursShort(Number(v))
                }
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                dataKey={
                  coach
                    ? cumulative
                      ? 'cumulative_sessions'
                      : 'sessions_held'
                    : cumulative
                      ? 'cumulative_hours_received'
                      : 'hours_received'
                }
                name={coach ? 'Sessions held' : 'Hours received'}
                type="linear"
                stroke="var(--ds-accent)"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              {!coach && (
                <Line
                  dataKey={
                    cumulative ? 'cumulative_expected_hours' : 'expected_hours'
                  }
                  name="Expected hours"
                  type="linear"
                  stroke="var(--ink-3)"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-8 text-sm text-ink-3">
          The chart becomes available when reporting dates and delivery are
          recorded.
        </p>
      )}
      <p className="mt-3 max-w-prose text-xs leading-relaxed text-ink-3">
        {coach
          ? 'Distinct meetings held by this coach. This shows activity, not a quality ranking or an individual delivery quota.'
          : 'The solid line shows coaching received. The dashed line shows expected delivery in the selected period. Current agreement status is shown separately above.'}
      </p>
      <details className="mt-4">
        <summary className="w-fit cursor-pointer text-xs text-ink-2 underline underline-offset-4">
          View chart data table
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">
              Weekly and cumulative delivery
            </caption>
            <thead>
              <tr>
                {(coach
                  ? ['Week', 'Sessions held', 'Cumulative sessions']
                  : [
                      'Week',
                      'Received',
                      'Expected',
                      'Cumulative received',
                      'Cumulative expected',
                    ]
                ).map(x => (
                  <th scope="col" key={x} className="px-3 py-2 font-medium">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series.map(row => (
                <tr className="border-t border-line" key={row.starts_on}>
                  <th
                    scope="row"
                    className="whitespace-nowrap px-3 py-2 font-normal"
                  >
                    {fmtDay(row.starts_on)}
                  </th>
                  {(coach
                    ? [row.sessions_held, row.cumulative_sessions]
                    : [
                        row.hours_received,
                        row.expected_hours,
                        row.cumulative_hours_received,
                        row.cumulative_expected_hours,
                      ]
                  ).map((value, i) => (
                    <td
                      className="whitespace-nowrap px-3 py-2 tabular-nums"
                      key={i}
                    >
                      {value == null
                        ? 'Unavailable'
                        : coach
                          ? value
                          : fmtHoursShort(value)}
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
