'use client'

import Link from 'next/link'
import { Empty, Section } from '@/components/sandboxes/section'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'
import { fmtDay, fmtWindow, pluralise } from '@/lib/sandbox/format'
import { parseDateOnly } from '@/lib/sandbox/term'
import { cn } from '@/lib/utils'
import type {
  SandboxDetailRhythm,
  SandboxEntityDetail,
} from '@/types/sandbox-details'

/** Where a day falls in the agreement's window, as a percentage. */
function place(day: string, start: string, end: string): number | null {
  const d = parseDateOnly(day)
  const a = parseDateOnly(start)
  const b = parseDateOnly(end)
  if (!d || !a || !b || b <= a) return null
  const pct = ((d.getTime() - a.getTime()) / (b.getTime() - a.getTime())) * 100
  return Math.min(100, Math.max(0, pct))
}

/** A long wait is one well past how often these two usually meet. */
function overdue(row: SandboxDetailRhythm): boolean {
  if (!row.current || row.days_since_last == null || row.next_on) return false
  return row.days_since_last > Math.max(21, (row.typical_gap_days ?? 0) * 2)
}

function everyDays(days: number | null): string {
  if (days == null) return '—'
  const n = Math.round(days)
  return n <= 1 ? 'Daily' : `Every ${n} days`
}

/** One mark per meeting date across the agreement; the gaps are the point. */
function Strip({ row, today }: { row: SandboxDetailRhythm; today: string }) {
  const now = place(today, row.starts_on, row.ends_on)
  const next = row.next_on
    ? place(row.next_on, row.starts_on, row.ends_on)
    : null
  return (
    <div
      role="img"
      aria-label={
        row.meetings
          ? `${pluralise(row.meetings, 'meeting')} between ${fmtWindow(row.starts_on, row.ends_on)}`
          : 'No meetings yet'
      }
      className="relative h-6"
      data-testid="rhythm-strip"
    >
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
      {now != null && row.current && (
        <span
          className="absolute top-0 h-full w-px bg-ink-4"
          style={{ left: `${now}%` }}
        />
      )}
      {row.meeting_dates.map(day => {
        const left = place(day, row.starts_on, row.ends_on)
        return (
          left != null && (
            <span
              key={day}
              title={fmtDay(day)}
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ds-accent"
              style={{ left: `${left}%` }}
            />
          )
        )
      })}
      {next != null && (
        <span
          title={`Next ${fmtDay(row.next_on!)}`}
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ds-accent bg-paper"
          style={{ left: `${next}%` }}
        />
      )}
    </div>
  )
}

function Fact({
  label,
  value,
  warn,
}: {
  label: string
  value: string
  warn?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-0.5 truncate text-sm tabular-nums',
          warn ? 'font-medium text-amber-token' : 'text-ink',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function RhythmRow({
  data,
  row,
  named,
}: {
  data: SandboxEntityDetail
  row: SandboxDetailRhythm
  named: boolean
}) {
  const today = data.stats!.as_of
  const late = overdue(row)
  return (
    <li className="py-4 first:pt-0 last:pb-0" data-testid="rhythm-row">
      {named && (
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <Link
            href={sandboxEntityHref(data.sandbox_id, 'client', row.member_id)}
            className="truncate text-sm font-medium text-ink hover:text-ds-accent hover:underline"
          >
            {row.name}
          </Link>
          {row.group_meetings_held != null && (
            <span
              className="flex-none text-xs tabular-nums text-ink-3"
              title="What the recordings show, not verified attendance"
            >
              Recorded in {row.group_meetings_recorded} of{' '}
              {pluralise(row.group_meetings_held, 'group meeting')}
            </span>
          )}
        </div>
      )}
      {!named && data.stats!.rhythm.length > 1 && (
        <p className="mb-1 text-xs text-ink-2">
          {row.group_name}
          {!row.current && ' · ended'}
        </p>
      )}
      <Strip row={row} today={today} />
      <div className="mt-0.5 flex justify-between font-mono text-[11px] text-ink-3">
        <span>{fmtDay(row.starts_on)}</span>
        <span>{fmtDay(row.ends_on)}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Fact label="Agreed" value={row.agreed ?? 'Not set'} />
        <Fact label="Actual" value={everyDays(row.typical_gap_days)} />
        <Fact
          label="Longest gap"
          value={
            row.longest_gap_days == null
              ? '—'
              : pluralise(row.longest_gap_days, 'day')
          }
        />
        {row.current ? (
          <Fact
            label="Since last"
            warn={late}
            value={
              row.days_since_last == null
                ? 'No meeting yet'
                : row.days_since_last === 0
                  ? 'Today'
                  : pluralise(row.days_since_last, 'day')
            }
          />
        ) : (
          <Fact label="Last" value={row.last_on ? fmtDay(row.last_on) : '—'} />
        )}
      </dl>
      {late && (
        <p className="mt-2 text-xs text-amber-token">
          Longer than usual since the last meeting, and nothing is booked.
        </p>
      )}
    </li>
  )
}

/**
 * How often they actually meet, against what was agreed. Measured over the
 * whole agreement so far — the reporting period above does not change it.
 */
export function RhythmSection({ data }: { data: SandboxEntityDetail }) {
  const stats = data.stats
  if (!stats) return null
  const group = data.entity.kind === 'group'
  const rows = group ? stats.rhythm.filter(r => r.current) : stats.rhythm
  const estimated = rows.reduce((n, r) => n + r.estimated_durations, 0)
  return (
    <Section
      id="rhythm"
      title="Session rhythm"
      testId="detail-rhythm"
      note={
        <>
          Whole agreement to date — the reporting period does not change this.
          {estimated > 0 &&
            ` ${pluralise(estimated, 'meeting length')} assumed from the agreement.`}
        </>
      }
    >
      {rows.length === 0 ? (
        <Empty>No coaching relationship to measure in this view.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map(row => (
            <RhythmRow
              key={`${row.member_id}:${row.group_id}:${row.starts_on}`}
              data={data}
              row={row}
              named={group}
            />
          ))}
        </ul>
      )}
    </Section>
  )
}
