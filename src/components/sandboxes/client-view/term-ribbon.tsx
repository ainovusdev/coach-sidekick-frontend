'use client'

import { fmtWindow } from '@/lib/sandbox/format'
import { daysBetween, parseDateOnly, toDateOnly } from '@/lib/sandbox/term'
import { cn } from '@/lib/utils'
import type { TimelineEvent } from '@/types/sandbox'
import type { SandboxAnalytics } from '@/types/sandbox-analytics'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** Each kind of milestone keeps the colour it has everywhere else. */
const KIND_CLASS: Record<TimelineEvent['kind'], string> = {
  gold_sealing: 'bg-amber-token',
  check_in: 'bg-indigo',
  midpoint_reporting: 'bg-ds-accent',
  results_review: 'bg-forest',
  custom: 'bg-ink-3',
}

/**
 * The whole term on one axis: the milestone windows, how much coaching
 * happened each week, and where today is. Hours stay in Progress — this band
 * answers "where are we in the year", not "how many hours".
 *
 * Hand-drawn SVG-free: the bars are positioned divs, so they reflow with the
 * container and stay legible at any width. Below 760px the page shows the
 * milestone list instead (see `client-view.tsx`).
 */
export function TermRibbon({
  termStart,
  termEnd,
  today,
  events,
  weeks,
}: {
  termStart: string
  termEnd: string
  today: string
  events: TimelineEvent[]
  weeks: SandboxAnalytics['weekly_series']
}) {
  const start = [termStart, ...events.map(e => e.window_start)].sort()[0]
  const end = [termEnd, ...events.map(e => e.window_end)].sort().slice(-1)[0]
  const from = parseDateOnly(start)
  const to = parseDateOnly(end)
  if (!from || !to) return null
  const span = Math.max(1, daysBetween(from, to))
  const at = (day: string) => {
    const d = parseDateOnly(day)
    return d ? (daysBetween(from, d) / span) * 100 : 0
  }
  const clamp = (n: number) => Math.max(0, Math.min(100, n))
  const todayAt = at(today)
  const showToday = today >= start && today <= end

  const months: string[] = []
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1)
  if (toDateOnly(cursor) < start) cursor.setMonth(cursor.getMonth() + 1)
  while (toDateOnly(cursor) <= end) {
    months.push(toDateOnly(cursor))
    cursor.setMonth(cursor.getMonth() + 1)
  }

  const busiest = Math.max(1, ...weeks.map(w => w.sessions_held ?? 0))

  return (
    <section
      className="rounded-xl border border-line bg-paper px-5 pb-4 pt-3"
      aria-label="The term at a glance"
      data-testid="term-ribbon"
    >
      <div className="relative h-4">
        {months.map(m => (
          <span
            key={m}
            className="absolute -translate-x-1/2 text-[10px] font-medium uppercase tracking-wider text-ink-4"
            style={{ left: `${clamp(at(m))}%` }}
          >
            {MONTHS[new Date(`${m}T00:00:00`).getMonth()]}
          </span>
        ))}
      </div>

      {/* Sessions each week, placed by date so a busy week sits under the
          month it happened in — the weeks cover the term, the axis may run
          past it (a results review sits a month after the term ends). */}
      <div className="relative mt-1 h-9" aria-hidden>
        {weeks.map(w => {
          const left = clamp(at(w.starts_on))
          const right = clamp(at(w.ends_on))
          return (
            <span
              key={w.starts_on}
              title={`Week of ${w.starts_on}: ${w.sessions_held ?? 0} sessions`}
              className={cn(
                'absolute bottom-0 rounded-t-sm',
                w.sessions_held ? 'bg-ds-accent/30' : 'bg-surface-3',
              )}
              style={{
                left: `${left}%`,
                width: `${Math.max(0.4, right - left - 0.15)}%`,
                height: `${Math.max(8, ((w.sessions_held ?? 0) / busiest) * 100)}%`,
              }}
            />
          )
        })}
      </div>

      <div className="relative mt-1.5 h-6">
        <div className="absolute inset-x-0 top-2.5 h-1 rounded-full bg-surface-3" />
        <div
          className="absolute top-2.5 h-1 rounded-full bg-line-strong"
          style={{
            left: `${clamp(at(termStart))}%`,
            width: `${clamp(at(termEnd) - at(termStart))}%`,
          }}
        />
        <div
          className="absolute top-2.5 h-1 rounded-full bg-ink"
          style={{
            left: `${clamp(at(termStart))}%`,
            width: `${clamp(Math.min(todayAt, at(termEnd)) - at(termStart))}%`,
          }}
        />
        {events.map(e => (
          <span
            key={e.id}
            title={`${e.label} · ${fmtWindow(e.window_start, e.window_end)}`}
            data-testid="ribbon-event"
            data-kind={e.kind}
            data-state={e.state}
            className={cn(
              'absolute top-1 h-4 rounded-sm',
              KIND_CLASS[e.kind],
              e.state === 'past' && 'opacity-40',
            )}
            style={{
              left: `${clamp(at(e.window_start))}%`,
              width: `${Math.max(0.9, clamp(at(e.window_end) - at(e.window_start)))}%`,
            }}
          />
        ))}
        {showToday && (
          <span
            className="absolute -top-0.5 h-7 w-px bg-vermillion"
            style={{ left: `${clamp(todayAt)}%` }}
            data-testid="ribbon-today"
          >
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-semibold uppercase tracking-wider text-vermillion">
              Today
            </span>
          </span>
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {events.map(e => (
          <li
            key={e.id}
            className={cn(
              'flex items-center gap-1.5 text-[11px]',
              e.state === 'past' ? 'text-ink-4' : 'text-ink-3',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                KIND_CLASS[e.kind],
                e.state === 'past' && 'opacity-40',
              )}
              aria-hidden
            />
            <span
              className={cn(e.state === 'current' && 'font-medium text-ink')}
            >
              {e.label}
            </span>
            <span className="font-mono">
              {fmtWindow(e.window_start, e.window_end)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
