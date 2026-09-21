/**
 * The client, coach and group pages, as pure functions: what the numbers on the
 * page say, from what the detail endpoint already returns. No React.
 *
 * One rule runs through all of it: a value the API could not measure is `null`
 * and renders as a dash with a reason — never as a zero.
 */

import { fmtHoursShort } from '@/lib/sandbox/delivery'
import { pluralise } from '@/lib/sandbox/format'
import { parseDateOnly } from '@/lib/sandbox/term'
import type { StatTone } from '@/components/ui/stat-strip'
import type {
  SandboxEntityDetail,
  SandboxRelationship,
} from '@/types/sandbox-details'
import type { SandboxAnalytics } from '@/types/sandbox-analytics'
import type { Outcome, SandboxOutcomes } from '@/types/sandbox-outcomes'
import type { TimelineEvent } from '@/types/sandbox'

const DAY = 86_400_000

function daysBetween(from: string, to: string): number | null {
  const a = parseDateOnly(from.slice(0, 10))
  const b = parseDateOnly(to.slice(0, 10))
  if (!a || !b) return null
  return Math.round((b.getTime() - a.getTime()) / DAY)
}

/** Hours against what was expected by today. Positive is ahead. */
export interface HoursGap {
  hours: number
  text: string
  tone: StatTone
}

export function hoursGap(
  contract: SandboxAnalytics['current_contract'],
): HoursGap | null {
  if (contract.expected_hours == null) return null
  const hours = contract.hours_received - contract.expected_hours
  // Under a quarter of an hour either way is on the line, not a finding.
  if (Math.abs(hours) < 0.25) return { hours: 0, text: 'On pace', tone: 'good' }
  return hours < 0
    ? {
        hours,
        text: `${fmtHoursShort(-hours)} behind`,
        tone: 'warning',
      }
    : { hours, text: `${fmtHoursShort(hours)} ahead`, tone: 'good' }
}

/** What is still owed on one agreement; `null` when no hours were agreed. */
export function hoursRemaining(r: {
  hours_received: number
  hours_promised: number | null
}): number | null {
  if (r.hours_promised == null) return null
  return Math.max(0, r.hours_promised - r.hours_received)
}

export function weeksLeft(endsOn: string | null, today: string): number | null {
  if (!endsOn) return null
  const days = daysBetween(today, endsOn)
  return days == null ? null : Math.max(0, Math.ceil(days / 7))
}

/** Current agreements with no session on the calendar. */
export function nothingBooked(
  rows: SandboxRelationship[],
): SandboxRelationship[] {
  return rows.filter(
    r => r.current && !r.next_activity_on && r.state !== 'complete',
  )
}

/** The soonest next session across current agreements. */
export function nextSessionOn(rows: SandboxRelationship[]): string | null {
  const dates = rows
    .filter(r => r.current && r.next_activity_on)
    .map(r => r.next_activity_on as string)
    .sort()
  return dates[0] ?? null
}

export function lastSessionOn(rows: SandboxRelationship[]): string | null {
  const dates = rows
    .filter(r => r.last_activity_on)
    .map(r => r.last_activity_on as string)
    .sort()
  return dates[dates.length - 1] ?? null
}

export interface OutcomeCounts {
  agreed: number
  waiting: number
  changesRequested: number
  drafting: number
  total: number
  /** Proposals this viewer may decide, oldest first. */
  waitingForYou: { outcome: Outcome; coachee: string; days: number | null }[]
}

/**
 * Outcome-level counts for the people this page is about. `memberIds` keeps a
 * viewer who is coached here from adding their own outcomes to someone else's
 * page; `null` means every coachee the response carries.
 */
export function outcomeCounts(
  outcomes: SandboxOutcomes,
  memberIds: Set<string> | null,
): OutcomeCounts {
  const counts: OutcomeCounts = {
    agreed: 0,
    waiting: 0,
    changesRequested: 0,
    drafting: 0,
    total: 0,
    waitingForYou: [],
  }
  for (const coachee of outcomes.coachees) {
    if (memberIds && !memberIds.has(coachee.member_id)) continue
    for (const outcome of coachee.outcomes) {
      counts.total++
      if (outcome.status === 'sealed') counts.agreed++
      else if (outcome.status === 'changes_requested') counts.changesRequested++
      else if (outcome.status === 'draft') counts.drafting++
      else {
        counts.waiting++
        if (coachee.can_approve)
          counts.waitingForYou.push({
            outcome,
            coachee: coachee.name || coachee.email,
            days: outcome.proposed_at
              ? daysBetween(outcome.proposed_at, outcomes.today)
              : null,
          })
      }
    }
  }
  counts.waitingForYou.sort((a, b) => (b.days ?? 0) - (a.days ?? 0))
  return counts
}

/** "2 agreed · 1 waiting · 1 changes requested" — only the parts that exist. */
export function outcomeSentence(c: OutcomeCounts): string {
  if (c.total === 0) return 'None yet'
  return [
    c.agreed && `${c.agreed} agreed`,
    c.waiting && `${c.waiting} waiting`,
    c.changesRequested && `${c.changesRequested} changes requested`,
    c.drafting && `${c.drafting} in draft`,
  ]
    .filter(Boolean)
    .join(' · ')
}

/**
 * Whose outcomes belong on this page: the person, or the current coachees.
 * Fixed — with nobody current it is nobody, never everyone in the response.
 */
export function outcomeSubjects(data: SandboxEntityDetail): Set<string> {
  if (data.entity.kind === 'client') return new Set([data.entity.id])
  return new Set(
    data.relationships.filter(r => r.current).map(r => r.member_id),
  )
}

/** Milestone windows that are open or still to come, soonest first. */
export function comingUp(
  milestones: TimelineEvent[],
  today: string,
  max = 3,
): TimelineEvent[] {
  return milestones
    .filter(m => !m.removed_at && m.window_end >= today)
    .sort((a, b) => a.window_start.localeCompare(b.window_start))
    .slice(0, max)
}

/** One coachee's row on a group or coach page. */
export interface CoacheeRow {
  memberId: string
  name: string
  relationship: SandboxRelationship
  outcomesAgreed: number
  outcomesTotal: number
}

const STATE_RANK: Record<string, number> = {
  behind: 0,
  ended_short: 0,
  not_started: 1,
  unknown: 2,
  on_track: 3,
  ahead: 4,
  complete: 5,
}

/** Current coachees, the ones who need someone first. */
export function coacheeRows(data: SandboxEntityDetail): CoacheeRow[] {
  const byMember = new Map(data.outcomes.coachees.map(c => [c.member_id, c]))
  return data.relationships
    .filter(r => r.current)
    .map(r => {
      const outcomes = byMember.get(r.member_id)?.outcomes ?? []
      return {
        memberId: r.member_id,
        name: r.name,
        relationship: r,
        outcomesAgreed: outcomes.filter(o => o.status === 'sealed').length,
        outcomesTotal: outcomes.length,
      }
    })
    .sort(
      (a, b) =>
        (STATE_RANK[a.relationship.state] ?? 2) -
          (STATE_RANK[b.relationship.state] ?? 2) ||
        Number(!!a.relationship.next_activity_on) -
          Number(!!b.relationship.next_activity_on) ||
        a.name.localeCompare(b.name),
    )
}

export function headcountText(contract: SandboxAnalytics['current_contract']) {
  const { count, total } = contract.coachees_on_track
  if (!total) return null
  const unmeasured = contract.coachees_unmeasurable
  return {
    main: `${count} of ${total} on track`,
    sub: unmeasured
      ? `${pluralise(unmeasured, 'coachee')} not measurable yet`
      : null,
  }
}
