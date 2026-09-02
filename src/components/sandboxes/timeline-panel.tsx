'use client'

import { Fragment } from 'react'
import { fmtWindow, pluralise } from '@/lib/sandbox/format'
import { daysBetween, parseDateOnly } from '@/lib/sandbox/term'
import { cn } from '@/lib/utils'
import type { SandboxOverview, TimelineEvent } from '@/types/sandbox'

function stateLabel(
  ev: TimelineEvent,
  index: number,
  events: TimelineEvent[],
  today: string,
): string {
  if (ev.state === 'past') return 'Past'
  if (ev.state === 'current') return 'Current'
  const firstUpcoming = events.findIndex(e => e.state === 'upcoming')
  if (index !== firstUpcoming) return 'Upcoming'
  if (index === 0) return 'First'
  const days = daysBetween(
    parseDateOnly(today)!,
    parseDateOnly(ev.window_start)!,
  )
  if (days <= 0) return 'Next'
  return `Next · in ${pluralise(days, 'day')}`
}

export function TimelinePanel({ overview }: { overview: SandboxOverview }) {
  const { timeline, today, sandbox } = overview
  const showToday = sandbox.status === 'active'
  // Insert the TODAY marker after the last event that has started.
  const todayIndex = showToday
    ? timeline.filter(e => e.window_start <= today).length
    : -1

  return (
    <section
      id="timeline"
      className="scroll-mt-6 rounded-xl border border-line bg-paper"
      data-testid="timeline-panel"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink">Timeline</h2>
        <span className="text-xs text-ink-3">
          {pluralise(timeline.length, 'event')}, generated from the term
        </span>
      </header>
      <div className="overflow-x-auto px-5 py-4">
        <ol className="flex min-w-max items-stretch gap-3">
          {timeline.map((ev, i) => (
            <Fragment key={ev.id}>
              {showToday && todayIndex === i && <TodayMarker />}
              <li
                className={cn(
                  'flex w-44 flex-col rounded-lg border px-3.5 py-3',
                  ev.state === 'current'
                    ? 'border-vermillion/40 bg-vermillion-bg'
                    : ev.state === 'past'
                      ? 'border-line bg-surface-2'
                      : 'border-line bg-paper',
                )}
                data-testid="timeline-event"
              >
                <span
                  className={cn(
                    'text-sm font-medium leading-tight',
                    ev.state === 'past' ? 'text-ink-3' : 'text-ink',
                  )}
                >
                  {ev.label}
                </span>
                <span className="mt-1 font-mono text-[11px] text-ink-3">
                  {fmtWindow(ev.window_start, ev.window_end)}
                </span>
                <span
                  className={cn(
                    'mt-3 h-1 rounded-full',
                    ev.state === 'current'
                      ? 'bg-vermillion'
                      : ev.state === 'past'
                        ? 'bg-ink-4'
                        : 'bg-surface-3',
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    'mt-2 text-[10px] font-semibold uppercase tracking-wider',
                    ev.state === 'current' ? 'text-vermillion' : 'text-ink-3',
                  )}
                >
                  {stateLabel(ev, i, timeline, today)}
                </span>
              </li>
            </Fragment>
          ))}
          {showToday && todayIndex >= timeline.length && <TodayMarker />}
        </ol>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs text-ink-3">
        Dates shift automatically if you change the term.
      </p>
    </section>
  )
}

function TodayMarker() {
  return (
    <li
      className="flex w-6 flex-col items-center justify-center"
      aria-label="Today"
    >
      <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-vermillion">
        Today
      </span>
      <span className="mt-1 w-px flex-1 bg-vermillion" aria-hidden />
    </li>
  )
}
