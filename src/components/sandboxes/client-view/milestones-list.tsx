'use client'

import { fmtWindow } from '@/lib/sandbox/format'
import { eventChipLabel, KIND_TONE } from '@/lib/sandbox/timeline'
import { cn } from '@/lib/utils'
import { Empty } from '@/components/sandboxes/section'
import type { TimelineEvent } from '@/types/sandbox'

/**
 * The client's calendar of the term: every window, when it opens, whether it
 * is open now. Inert by design — a milestone carries work on our side, and
 * none of that crosses to theirs, so nothing here opens a commitment.
 */
export function MilestonesList({
  events,
  today,
}: {
  events: TimelineEvent[]
  today: string
}) {
  if (!events.length) return <Empty>No milestones scheduled yet.</Empty>
  return (
    <ol className="space-y-0.5">
      {events.map(event => (
        <li
          key={event.id}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2 py-1.5',
            event.state === 'current' && 'bg-vermillion-bg',
          )}
          data-testid="timeline-event"
          data-kind={event.kind}
          data-state={event.state}
        >
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              KIND_TONE[event.kind],
              event.state === 'past' && 'opacity-40',
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'truncate text-sm',
                event.state === 'past' ? 'text-ink-3' : 'font-medium text-ink',
              )}
            >
              {event.label}
            </p>
            <p className="font-mono text-[11px] text-ink-3">
              {fmtWindow(event.window_start, event.window_end)}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 text-[10px] font-semibold uppercase tracking-wider',
              event.state === 'current' ? 'text-vermillion' : 'text-ink-4',
            )}
          >
            {event.state === 'past'
              ? 'Closed'
              : eventChipLabel(event, today).split(' · ')[0]}
          </span>
        </li>
      ))}
    </ol>
  )
}
