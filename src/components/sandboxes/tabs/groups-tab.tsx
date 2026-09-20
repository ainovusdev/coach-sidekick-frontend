'use client'

import { GroupsSection } from '@/components/sandboxes/groups/groups-section'
import type { SandboxOverview } from '@/types/sandbox'

/**
 * Who works with whom — 1:1 pairings and groups.
 *
 * People decides who is on the sandbox; this tab only arranges them. It is
 * always reachable, because a group that exists must stay fixable; what waits
 * for a coach and a coachee on People is starting a new one.
 */
export function GroupsTab({
  overview,
  onGoToPeople,
}: {
  overview: SandboxOverview
  onGoToPeople: () => void
}) {
  return <GroupsSection overview={overview} onGoToPeople={onGoToPeople} />
}
