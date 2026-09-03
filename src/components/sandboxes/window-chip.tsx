import { fmtWindow } from '@/lib/sandbox/format'
import { eventChipLabel } from '@/lib/sandbox/timeline'
import { cn } from '@/lib/utils'
import type { EventState } from '@/types/sandbox'

type Windowish = {
  id: string
  label: string
  window_start: string
  window_end: string
  state: EventState
}

const CHIP: Record<EventState, string> = {
  current: 'border-vermillion/40 bg-vermillion-bg text-vermillion',
  upcoming: 'border-line bg-paper text-ink-2',
  past: 'border-line bg-surface-2 text-ink-3',
}

const DOT: Record<EventState, string> = {
  current: 'bg-vermillion',
  upcoming: 'bg-ink-4',
  past: 'bg-ink-4',
}

/**
 * One timeline window as a chip ("Check-in 2 · Open · 9 days left") or a
 * row (label, dates, state). Same palette as the cockpit timeline.
 */
export function WindowChip({
  event,
  today,
  variant = 'chip',
  className,
}: {
  event: Windowish
  today: string
  variant?: 'chip' | 'row'
  className?: string
}) {
  const state = eventChipLabel(event, today)
  if (variant === 'row') {
    return (
      <div
        className={cn('flex items-center gap-3', className)}
        data-testid="window-row"
        data-state={event.state}
      >
        <span
          className={cn('h-2 w-2 shrink-0 rounded-full', DOT[event.state])}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{event.label}</p>
          <p className="font-mono text-[11px] text-ink-3">
            {fmtWindow(event.window_start, event.window_end)}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 text-[11px] font-semibold uppercase tracking-wider',
            event.state === 'current' ? 'text-vermillion' : 'text-ink-3',
          )}
        >
          {state}
        </span>
      </div>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        CHIP[event.state],
        className,
      )}
      title={fmtWindow(event.window_start, event.window_end)}
      data-testid="window-chip"
      data-state={event.state}
    >
      <span
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[event.state])}
        aria-hidden
      />
      <span className="truncate">{event.label}</span>
      <span className="shrink-0 font-normal opacity-80">· {state}</span>
    </span>
  )
}
