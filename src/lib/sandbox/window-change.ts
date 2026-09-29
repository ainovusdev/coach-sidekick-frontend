import { firstName, fmtDay, pluralise } from '@/lib/sandbox/format'
import type { WindowChange } from '@/types/sandbox'

const hoursOf = (minutes: number) => {
  const h = Math.round((minutes / 60) * 10) / 10
  return `${h} h`
}

/**
 * What a window change would count, in a sentence:
 * "Adds 4 sessions · 3 h for Mohammad (12 Aug – 3 Sep). 1 scheduled session
 * will need a choice."
 */
export function describeWindowChange(change: WindowChange): string {
  const gained = change.coachees.filter(c => c.sessions_gained > 0)
  const lost = change.coachees.filter(c => c.sessions_gained < 0)
  const parts: string[] = []
  if (gained.length === 0 && lost.length === 0) {
    parts.push('No sessions fall in the days this adds.')
  }
  for (const c of gained) {
    const span =
      c.first_on && c.last_on && c.first_on !== c.last_on
        ? ` (${fmtDay(c.first_on)} – ${fmtDay(c.last_on)})`
        : c.first_on
          ? ` (${fmtDay(c.first_on)})`
          : ''
    const who = c.name ? firstName(c.name, '') : 'a coachee'
    parts.push(
      `Adds ${pluralise(c.sessions_gained, 'session')} · ${hoursOf(c.minutes_gained)} for ${who}${c.is_current ? '' : ', who has left the group'}${gained.length === 1 ? span : ''}.`,
    )
  }
  for (const c of lost) {
    const who = c.name ? firstName(c.name, '') : 'a coachee'
    parts.push(
      `${pluralise(-c.sessions_gained, 'session')} would stop counting for ${who}.`,
    )
  }
  if (change.becomes_ambiguous > 0) {
    parts.push(
      `${pluralise(change.becomes_ambiguous, 'session')} will fit two groups and need a choice.`,
    )
  }
  return parts.join(' ')
}

/** Worth stopping for: the save changes what counts, or asks for a decision. */
export function windowChangeMatters(change: WindowChange): boolean {
  return (
    change.becomes_ambiguous > 0 ||
    change.coachees.some(c => c.sessions_gained !== 0)
  )
}
