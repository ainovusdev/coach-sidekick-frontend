/**
 * The words the client view says.
 *
 * The headline is built from values that may be missing — hours may not be
 * promised, a term may not have started, nobody may be measurable yet — so
 * every clause is dropped rather than written with a blank in it. Pure, so the
 * sentences can be unit-tested without rendering anything.
 */

import { fmtDay, pluralise } from '@/lib/sandbox/format'
import { fmtHoursShort } from '@/lib/sandbox/delivery'
import type { SandboxAnalytics } from '@/types/sandbox-analytics'
import type { DeliveryState } from '@/types/sandbox-delivery'
import type { TimelineEvent } from '@/types/sandbox'
import type { Lifecycle } from './client-view-model'

/** A clause is either plain text or text we want emphasised in the sentence. */
export interface Clause {
  text: string
  strong?: boolean
}

export type Sentence = Clause[]

const PACE_OPENING: Partial<Record<DeliveryState, Sentence>> = {
  behind: [{ text: 'Delivery is ' }, { text: 'behind pace', strong: true }],
  on_track: [{ text: 'Delivery is ' }, { text: 'on pace', strong: true }],
  ahead: [{ text: 'Delivery is ' }, { text: 'ahead of pace', strong: true }],
  complete: [
    { text: 'Every promised hour', strong: true },
    { text: ' has been delivered' },
  ],
  ended_short: [
    { text: 'The term ' },
    { text: 'ended short', strong: true },
    { text: ' of its promised hours' },
  ],
  not_started: [
    { text: 'Coaching ' },
    { text: 'hasn’t started', strong: true },
    { text: ' yet' },
  ],
}

/** "expected by 16 Sep" — or, once the term is over, by its end. */
export function expectedBy(life: Lifecycle, asOf: string): string {
  return life.kind === 'ended'
    ? 'expected by the end of the term'
    : `expected by ${fmtDay(asOf)}`
}

/**
 * The paragraph under the term ribbon: where delivery stands, how many people
 * are on track and agreed, what is waiting on this person, and what is next.
 */
export function headline({
  life,
  contract,
  metrics,
  needs,
  nextEvent,
  people,
  groups,
  termStart,
}: {
  life: Lifecycle
  contract: SandboxAnalytics['current_contract'] | null
  metrics: SandboxAnalytics['metrics'] | null
  needs: number
  nextEvent: TimelineEvent | null
  people: number
  groups: number
  termStart: string
}): Sentence[] {
  if (life.kind === 'upcoming')
    return [
      [
        { text: 'Coaching starts on ' },
        { text: fmtDay(termStart), strong: true },
        {
          text: ` for ${pluralise(people, 'coachee')} in ${pluralise(groups, 'group')}.`,
        },
      ],
      [
        {
          text: 'Hours, pace and outcomes appear here once the first sessions are held.',
        },
      ],
    ]

  const sentences: Sentence[] = []
  if (contract) {
    const opening = PACE_OPENING[contract.state]
    if (opening) {
      const clauses = [...opening]
      const measured = ['behind', 'on_track', 'ahead'].includes(contract.state)
      if (
        measured &&
        contract.expectation_available &&
        contract.expected_hours != null
      ) {
        clauses.push({
          text: `: ${fmtHoursShort(contract.hours_received)} received against ${fmtHoursShort(contract.expected_hours)} ${expectedBy(life, contract.as_of)}`,
        })
      } else if (contract.hours_promised) {
        clauses.push({
          text: `: ${fmtHoursShort(contract.hours_received)} of ${fmtHoursShort(contract.hours_promised)} promised`,
        })
      }
      clauses.push({ text: '.' })
      sentences.push(clauses)
    }
  }

  const second: Sentence = []
  if (contract?.coachees_on_track.total) {
    second.push(
      {
        text: `${contract.coachees_on_track.count} of ${contract.coachees_on_track.total}`,
        strong: true,
      },
      { text: ' started coachees are on track' },
    )
  }
  if (metrics?.agreed_outcomes.total) {
    if (second.length) second.push({ text: ', and ' })
    second.push(
      {
        text: `${metrics.agreed_outcomes.count} of ${metrics.agreed_outcomes.total}`,
        strong: true,
      },
      { text: ' have a gold-sealed outcome' },
    )
  }
  if (second.length) {
    second.push({ text: '.' })
    sentences.push(second)
  }

  if (needs > 0)
    sentences.push([
      { text: pluralise(needs, 'outcome'), strong: true },
      { text: ` ${needs === 1 ? 'waits' : 'wait'} for your gold seal.` },
    ])

  if (nextEvent)
    sentences.push(
      nextEvent.state === 'current'
        ? [
            { text: nextEvent.label, strong: true },
            { text: ` is open until ${fmtDay(nextEvent.window_end)}.` },
          ]
        : [
            { text: 'Next: ' },
            { text: nextEvent.label, strong: true },
            { text: `, ${fmtDay(nextEvent.window_start)}.` },
          ],
    )
  return sentences
}

/** Plain text of a headline — what a screen reader and a test both read. */
export function sentenceText(sentences: Sentence[]): string {
  return sentences
    .map(s => s.map(c => c.text).join(''))
    .join(' ')
    .replace(/\s+([.,])/g, '$1')
}

export const PERIOD_LABEL: Record<string, string> = {
  term: 'Term',
  '90d': '90 days',
  '30d': '30 days',
}

export function periodWord(period: string): string {
  return period === 'term'
    ? 'this term'
    : period === '90d'
      ? 'in the last 90 days'
      : 'in the last 30 days'
}

/** "About 2 sessions behind" — the sentence under a coachee's pace chip. */
export function paceGap(pace: {
  state: DeliveryState
  variance: number | null
}): string {
  if (pace.state === 'not_started') return 'No session yet'
  if (pace.state === 'complete') return 'All sessions delivered'
  if (pace.state === 'unknown') return 'Hours not set'
  if (pace.variance == null) return ''
  const n = Math.round(Math.abs(pace.variance))
  if (pace.state === 'on_track' || n === 0) return 'On pace for the term'
  return `About ${pluralise(n, 'session')} ${pace.variance < 0 ? 'behind' : 'ahead'}`
}

/** "Today" · "Tomorrow" · "In 4 days" · "12 Oct" */
export function whenLabel(date: string, today: string): string {
  const a = new Date(`${today}T00:00:00`)
  const b = new Date(`${date.slice(0, 10)}T00:00:00`)
  const days = Math.round((b.getTime() - a.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 1 && days < 7) return `In ${days} days`
  if (days < -1 && days > -7) return `${days * -1} days ago`
  return fmtDay(date.slice(0, 10))
}

/** The gold-sealing window, said once, above the outcome list. */
export function sealingLine(
  window: { state: string; window_start: string; window_end: string } | null,
  waiting: number,
  sentBack: number,
): string {
  const head = !window
    ? 'Gold sealing isn’t scheduled yet'
    : window.state === 'past'
      ? `Gold sealing closed ${fmtDay(window.window_end)}`
      : window.state === 'current'
        ? `Gold sealing is open until ${fmtDay(window.window_end)}`
        : `Gold sealing opens ${fmtDay(window.window_start)}`
  const parts = [head]
  if (waiting) parts.push(`${pluralise(waiting, 'outcome')} waiting for a seal`)
  if (sentBack) parts.push(`${sentBack} sent back for changes`)
  return parts.join(' · ')
}
