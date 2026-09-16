'use client'

/**
 * Every read the client view makes, in one place.
 *
 * Six sources, no new endpoints: the overview the page already has, reporting
 * (the term, the selected period, and a second short read for "last 30 days"),
 * outcomes, attention, the sandbox activity feed and the viewer's own
 * commitments. The derivations live in `client-view-model.ts`, so this file is
 * only about fetching and stitching.
 */

import { useMemo } from 'react'
import { fmtDay } from '@/lib/sandbox/format'
import {
  useInsightViewer,
  useSandboxReporting,
  type SandboxReporting,
} from '@/hooks/queries/use-sandbox-insights'
import { useSandboxEntityActivity } from '@/hooks/queries/use-sandbox-details'
import {
  useSandboxAttention,
  useSandboxOutcomes,
} from '@/hooks/queries/use-sandboxes'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useViewerId } from '@/hooks/use-viewer-id'
import { isAssignedTo } from '@/lib/commitments/assignee'
import type { InsightSelection } from '@/types/sandbox-analytics'
import type { SandboxOverview } from '@/types/sandbox'
import type { Commitment } from '@/types/commitment'
import {
  CONTACT_ROLES,
  WATCH_KINDS,
  comingUpFrom,
  countByStatus,
  groupsFrom,
  lifecycleOf,
  namesFrom,
  needsFrom,
  peopleFrom,
  updatesFrom,
  withoutRights,
  type ClientViewModel,
} from './client-view-model'

const TERM: InsightSelection = { period: 'term', group_id: null }
const LAST_30: InsightSelection = { period: '30d', group_id: null }

const OPEN_STATUSES = ['completed', 'abandoned']

export interface ClientViewData {
  model: ClientViewModel
  /** The term read: the numbers every headline and scorecard is written from. */
  term: SandboxReporting
  /** What the period selector is showing (the term read when nothing is picked). */
  selected: SandboxReporting
  /** Sessions held in the last 30 days — a second read, never a sum of buckets. */
  sessionsLast30: number | null
  loading: boolean
  /** More activity to page through. */
  moreUpdates: boolean
  loadingMore: boolean
  fetchMoreUpdates: () => void
}

export function useClientView(
  overview: SandboxOverview,
  selection: InsightSelection,
  { preview = false }: { preview?: boolean } = {},
): ClientViewData {
  const sandboxId = overview.sandbox.id
  const viewer = useInsightViewer()
  const viewerId = useViewerId()
  const isTerm = selection.period === 'term' && selection.group_id === null

  const term = useSandboxReporting(sandboxId, viewer, TERM)
  const filtered = useSandboxReporting(
    sandboxId,
    isTerm ? null : viewer,
    selection,
    { learning: false },
  )
  const last30 = useSandboxReporting(sandboxId, viewer, LAST_30, {
    learning: false,
  })
  const selected = isTerm ? term : filtered

  const outcomes = useSandboxOutcomes(sandboxId)
  const attention = useSandboxAttention(sandboxId)
  const activity = useSandboxEntityActivity(sandboxId, viewer, TERM, !!viewer)
  // A preview shows the client's layout, not the client's inbox: commitments
  // follow each person's own visibility, so they are left out entirely.
  const commitments = useCommitments(
    { sandbox_id: sandboxId },
    { enabled: !preview },
  )

  const activityItems = useMemo(
    () => (activity.data?.pages ?? []).flatMap(page => page.items),
    [activity.data],
  )

  const model = useMemo<ClientViewModel>(() => {
    const analytics = term.analytics
    const outcomeData = preview ? withoutRights(outcomes.data) : outcomes.data
    const people = peopleFrom(analytics, overview.groups, outcomeData)
    const timeline = overview.timeline
    const myCommitments: Commitment[] = preview
      ? []
      : (commitments.data?.commitments ?? []).filter(
          c => !OPEN_STATUSES.includes(c.status) && isAssignedTo(c, viewerId),
        )
    return {
      sandbox: overview.sandbox,
      today: overview.today,
      life: lifecycleOf(overview.sandbox, overview.today, fmtDay),
      scope: overview.my_scope,
      whole: overview.my_scope === 'groups' ? 'your groups' : 'the programme',
      groups: groupsFrom(analytics, overview.groups),
      people,
      coaches: analytics?.coaches ?? [],
      needs: needsFrom(outcomeData),
      myCommitments,
      watch: (attention.data ?? []).filter(item =>
        WATCH_KINDS.includes(item.kind),
      ),
      comingUp: comingUpFrom(
        analytics,
        activityItems,
        timeline,
        overview.today,
      ),
      milestones: timeline,
      nextEvent:
        timeline.find(e => e.state === 'current') ??
        timeline.find(e => e.state === 'upcoming') ??
        null,
      updates: updatesFrom(activityItems, overview.today).filter(
        item => !preview || item.kind !== 'commitment',
      ),
      updateNames: namesFrom(overview.members),
      team: overview.members.filter(
        m => m.side === 'ours' && m.roles.some(r => CONTACT_ROLES.includes(r)),
      ),
      outcomes: outcomeData ?? null,
      outcomeTotals: outcomeData?.totals ?? null,
      waitingForSeal: countByStatus(outcomeData, 'proposed'),
      sentBack: countByStatus(outcomeData, 'changes_requested'),
    }
  }, [
    overview,
    term.analytics,
    outcomes.data,
    attention.data,
    activityItems,
    commitments.data,
    viewerId,
    preview,
  ])

  return {
    model,
    term,
    selected,
    sessionsLast30: last30.analytics?.metrics.sessions_held ?? null,
    loading: term.loading || outcomes.isLoading,
    moreUpdates: !!activity.hasNextPage,
    loadingMore: activity.isFetchingNextPage,
    fetchMoreUpdates: () => void activity.fetchNextPage(),
  }
}
