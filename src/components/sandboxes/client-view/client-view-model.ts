/**
 * The client view's reading of the sandbox API.
 *
 * Everything here is pure, so the rules that matter — which attention rows a
 * client sees, which activity rows count as "what happened", how one outcome's
 * history collapses to one line — are unit-testable and live in one place.
 *
 * No endpoint is new: this only re-reads what `/overview`, `/analytics`,
 * `/outcomes`, `/attention`, `/activity` and `/commitments` already return.
 */

import { lifecycleOf } from '@/lib/sandbox/term'
import type { Lifecycle } from '@/lib/sandbox/term'
import type {
  SandboxGroup,
  SandboxMember,
  SandboxOverview,
  TimelineEvent,
} from '@/types/sandbox'
import type { SandboxAnalytics } from '@/types/sandbox-analytics'
import type {
  AttentionItem,
  AttentionKind,
  CoacheeDelivery,
} from '@/types/sandbox-delivery'
import type { SandboxActivityItem } from '@/types/sandbox-details'
import type {
  CoacheeOutcomes,
  Outcome,
  OutcomeTotals,
  SandboxOutcomes,
} from '@/types/sandbox-outcomes'
import type { Commitment } from '@/types/commitment'

// "Week 20 of 26" moved beside the other term arithmetic when the cockpit
// started saying it too; re-exported so this view's callers are untouched.
export { lifecycleOf }
export type { Lifecycle, LifecycleKind } from '@/lib/sandbox/term'

/**
 * What a client is shown as something to watch: delivery that has slipped and
 * windows that are open or about to be. Our own operational chores
 * (invitations, half-finished groups) never appear, and outcomes that need a
 * decision are not "watch" items — they are in Needs you, with the buttons.
 */
export const WATCH_KINDS: AttentionKind[] = [
  'behind',
  'no_session_yet',
  'window_open',
  'window_opening',
]

/** Our side of the room, as the client meets it. */
export const CONTACT_ROLES = [
  'account_executive',
  'sandbox_owner',
  'lead_coach',
]

export interface ClientPerson extends CoacheeDelivery {
  groupId: string
  groupName: string
  coachNames: string[]
  outcomes: CoacheeOutcomes | null
}

export interface ClientGroup {
  groupId: string
  displayName: string
  coachNames: string[]
  coacheeCount: number
  sessionsHeld: number
  hoursReceived: number
  hoursPromised: number | null
  onTrack: { count: number; total: number }
  yetToStart: number
  lastActivityOn: string | null
  nextActivityOn: string | null
  state: CoacheeDelivery['pace']['state']
}

export interface NeedsOutcome {
  outcome: Outcome
  coachee: CoacheeOutcomes
}

export interface ComingUpItem {
  key: string
  /** The day it sits under, YYYY-MM-DD. */
  date: string
  title: string
  detail: string
  /** An ISO datetime when we know the time of day. */
  at: string | null
  kind: 'session' | 'milestone'
  milestoneKind?: TimelineEvent['kind']
}

export interface ClientViewModel {
  sandbox: SandboxOverview['sandbox']
  today: string
  life: Lifecycle
  scope: SandboxOverview['my_scope']
  /** "the programme" / "your groups" — everything scope-aware reads from here. */
  whole: string
  groups: ClientGroup[]
  people: ClientPerson[]
  coaches: SandboxAnalytics['coaches']
  needs: NeedsOutcome[]
  myCommitments: Commitment[]
  watch: AttentionItem[]
  comingUp: ComingUpItem[]
  milestones: TimelineEvent[]
  nextEvent: TimelineEvent | null
  updates: SandboxActivityItem[]
  updateNames: Record<string, string>
  team: SandboxMember[]
  outcomes: SandboxOutcomes | null
  outcomeTotals: OutcomeTotals | null
  waitingForSeal: number
  sentBack: number
}

// ------------------------------------------------------------------ people

/**
 * One card per coachee, from the analytics groups — which already carry each
 * coachee's delivery, so no second delivery request is made. A coachee in two
 * groups appears once, under the first group they are scoped to see.
 */
export function peopleFrom(
  analytics: SandboxAnalytics | undefined,
  groups: SandboxGroup[],
  outcomes: SandboxOutcomes | undefined,
): ClientPerson[] {
  if (!analytics) return []
  const coaches = new Map(
    groups.map(g => [g.id, g.coaches.map(c => c.name || c.email)]),
  )
  const byMember = new Map(
    (outcomes?.coachees ?? []).map(c => [c.member_id, c]),
  )
  const seen = new Set<string>()
  const people: ClientPerson[] = []
  for (const group of analytics.groups) {
    for (const coachee of group.coachees) {
      if (seen.has(coachee.member_id)) continue
      seen.add(coachee.member_id)
      people.push({
        ...coachee,
        groupId: group.group_id,
        groupName: group.display_name,
        coachNames: coaches.get(group.group_id) ?? [],
        outcomes: byMember.get(coachee.member_id) ?? null,
      })
    }
  }
  return people
}

export function groupsFrom(
  analytics: SandboxAnalytics | undefined,
  groups: SandboxGroup[],
): ClientGroup[] {
  if (!analytics) return []
  const byId = new Map(groups.map(g => [g.id, g]))
  return analytics.groups.map(g => ({
    groupId: g.group_id,
    displayName: g.display_name,
    coachNames: (byId.get(g.group_id)?.coaches ?? []).map(
      c => c.name || c.email,
    ),
    coacheeCount: g.coachees.length,
    sessionsHeld: g.sessions_held,
    hoursReceived: g.hours_received,
    hoursPromised: g.hours_promised,
    onTrack: g.coachees_on_track,
    yetToStart: g.yet_to_start,
    lastActivityOn: g.last_activity_on,
    nextActivityOn: g.next_activity_on,
    state: g.state,
  }))
}

// ----------------------------------------------------------------- updates

/**
 * What has happened, newest first.
 *
 * Scheduled sessions bypass the feed's date filter, so they arrive here with
 * future dates: they belong under Coming up, never under "latest updates".
 * One outcome's history is several rows (`outcome:{id}:{index}`); the client
 * wants the latest state of each outcome, not the paper trail.
 */
export function updatesFrom(
  items: SandboxActivityItem[],
  today: string,
): SandboxActivityItem[] {
  const seen = new Set<string>()
  return items.filter(item => {
    if (item.kind === 'session' && item.status === 'scheduled') return false
    if (item.occurred_at.slice(0, 10) > today) return false
    if (item.kind !== 'outcome') return true
    const id = item.id.split(':')[1] ?? item.id
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

/** member_id → the name to say, for the rows that name someone. */
export function namesFrom(members: SandboxMember[]): Record<string, string> {
  const names: Record<string, string> = {}
  for (const m of members) names[m.id] = m.name || m.email
  return names
}

// ---------------------------------------------------------------- coming up

export function comingUpFrom(
  analytics: SandboxAnalytics | undefined,
  activity: SandboxActivityItem[],
  timeline: TimelineEvent[],
  today: string,
): ComingUpItem[] {
  const scheduled = new Map(
    activity
      .filter(a => a.kind === 'session' && a.status === 'scheduled')
      .map(a => [a.session_id ?? a.id, a]),
  )
  const rows: ComingUpItem[] = []
  for (const s of analytics?.upcoming ?? []) {
    const item = scheduled.get(s.session_id)
    rows.push({
      key: `session:${s.session_id}`,
      date: s.scheduled_on,
      title: item?.title || 'Coaching session',
      detail: item?.detail ?? '',
      at: item?.occurred_at ?? null,
      kind: 'session',
    })
  }
  for (const event of timeline.filter(e => e.state !== 'past')) {
    rows.push({
      key: `event:${event.id}`,
      date: event.state === 'current' ? today : event.window_start,
      title: event.label,
      detail: '',
      at: null,
      kind: 'milestone',
      milestoneKind: event.kind,
    })
  }
  return rows.sort(byDate)
}

function byDate(a: ComingUpItem, b: ComingUpItem) {
  return a.date.localeCompare(b.date)
}

// ----------------------------------------------------------------- needs you

/** Outcomes this viewer may decide on, oldest proposal first. */
export function needsFrom(
  outcomes: SandboxOutcomes | undefined,
): NeedsOutcome[] {
  const rows: NeedsOutcome[] = []
  for (const coachee of outcomes?.coachees ?? []) {
    if (!coachee.can_approve) continue
    for (const outcome of coachee.outcomes) {
      if (outcome.status === 'proposed') rows.push({ outcome, coachee })
    }
  }
  return rows.sort((a, b) =>
    (a.outcome.proposed_at ?? '').localeCompare(b.outcome.proposed_at ?? ''),
  )
}

/**
 * The client layout shown to our side reads; it never writes.
 *
 * Whoever is previewing may genuinely hold approval rights on this sandbox —
 * a platform admin does — and the banner promises the actions are hidden, so
 * the rights are taken off the rows rather than hidden one control at a time.
 * Nothing here can reach the API: `can_*` only decides which buttons exist.
 */
export function withoutRights(
  outcomes: SandboxOutcomes | undefined,
): SandboxOutcomes | undefined {
  if (!outcomes) return outcomes
  return {
    ...outcomes,
    can_reopen: false,
    coachees: outcomes.coachees.map(c => ({
      ...c,
      can_propose: false,
      can_approve: false,
    })),
  }
}

export function totalsFrom(
  outcomes: SandboxOutcomes | undefined,
): OutcomeTotals | null {
  return outcomes?.totals ?? null
}

export function countByStatus(
  outcomes: SandboxOutcomes | undefined,
  status: Outcome['status'],
): number {
  return (outcomes?.coachees ?? []).reduce(
    (n, c) => n + c.outcomes.filter(o => o.status === status).length,
    0,
  )
}
