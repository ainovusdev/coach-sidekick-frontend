// Timeline event vocabulary shared by the cockpit panel and the dashboard chips.
import { pluralise } from '@/lib/sandbox/format'
import { daysBetween, parseDateOnly } from '@/lib/sandbox/term'
import type { EventState, TimelineEvent } from '@/types/sandbox'

/** "Past" · "Current" · "Next · in 12 days" · "Upcoming" (position-aware). */
export function eventStateLabel(
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

/** "Open · 9 days left" · "Opens in 14 days" · "Past" — for a lone chip. */
export function eventChipLabel(
  ev: Pick<TimelineEvent, 'state' | 'window_start' | 'window_end'>,
  today: string,
): string {
  const now = parseDateOnly(today)!
  if (ev.state === 'past') return 'Past'
  if (ev.state === 'current') {
    const left = daysBetween(now, parseDateOnly(ev.window_end)!)
    return left <= 0
      ? 'Open · closes today'
      : `Open · ${pluralise(left, 'day')} left`
  }
  const ahead = daysBetween(now, parseDateOnly(ev.window_start)!)
  return ahead <= 0 ? 'Opens today' : `Opens in ${pluralise(ahead, 'day')}`
}

export const EVENT_CARD_CLASS: Record<EventState, string> = {
  current: 'border-vermillion/40 bg-vermillion-bg',
  past: 'border-line bg-surface-2',
  upcoming: 'border-line bg-paper',
}

export const EVENT_BAR_CLASS: Record<EventState, string> = {
  current: 'bg-vermillion',
  past: 'bg-ink-4',
  upcoming: 'bg-surface-3',
}

export const EVENT_TITLE_CLASS: Record<EventState, string> = {
  current: 'text-ink',
  past: 'text-ink-3',
  upcoming: 'text-ink',
}

export const EVENT_STATE_TEXT_CLASS: Record<EventState, string> = {
  current: 'text-vermillion',
  past: 'text-ink-3',
  upcoming: 'text-ink-3',
}
