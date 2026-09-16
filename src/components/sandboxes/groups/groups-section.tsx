'use client'

import { useState } from 'react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { GroupDrawer } from '@/components/sandboxes/group-drawer'
import {
  GroupBlockedDialog,
  type GroupBlock,
} from '@/components/sandboxes/group-blocked-dialog'
import { GroupsPanel } from '@/components/sandboxes/groups-panel'
import { IncompleteBanner } from '@/components/sandboxes/incomplete-banner'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import {
  sandboxErrorDetail,
  useDeleteGroup,
} from '@/hooks/mutations/use-sandbox-mutations'
import { useSandboxDelivery } from '@/hooks/queries/use-sandboxes'
import type { SandboxGroup, SandboxOverview } from '@/types/sandbox'

/**
 * Groups, with everything it takes to build and fix one.
 *
 * A group is an arrangement of people, so it sits above the roster on People
 * rather than on a tab of its own. The drawer and the two dialogs live here
 * rather than in the page shell: nothing outside this section opens them.
 */
export function GroupsSection({ overview }: { overview: SandboxOverview }) {
  const sandboxId = overview.sandbox.id
  const { can } = useSandboxView()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerGroup, setDrawerGroup] = useState<SandboxGroup | null>(null)
  const [deleting, setDeleting] = useState<SandboxGroup | null>(null)
  const [blocked, setBlocked] = useState<GroupBlock | null>(null)
  const deleteGroup = useDeleteGroup(sandboxId)

  // The same query the roster reads (one request, shared cache) — a group with
  // sessions on record can't be removed, and we say so before asking.
  const { data: delivery } = useSandboxDelivery(sandboxId)

  const openDrawer = (group: SandboxGroup | null) => {
    setDrawerGroup(group)
    setDrawerOpen(true)
  }

  const askToRemove = (group: SandboxGroup) => {
    const held = delivery?.groups.find(g => g.group_id === group.id)
    const withSessions =
      held?.coachees.filter(
        c => c.delivered.sessions + c.delivered.in_flight > 0,
      ) ?? []
    const sessions = withSessions.reduce(
      (n, c) => n + c.delivered.sessions + c.delivered.in_flight,
      0,
    )
    if (sessions > 0) {
      setBlocked({
        groupName: group.display_name,
        sessions,
        coacheeNames: withSessions.map(c => c.name ?? c.email),
      })
      return
    }
    setDeleting(group)
  }

  return (
    <div className="space-y-4">
      {can.editGroups && (
        <IncompleteBanner groups={overview.groups} onFinish={openDrawer} />
      )}
      <GroupsPanel
        overview={overview}
        onNew={() => openDrawer(null)}
        onEdit={openDrawer}
        onDelete={askToRemove}
      />

      {can.editGroups && (
        <GroupDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          overview={overview}
          group={drawerGroup}
        />
      )}
      <GroupBlockedDialog
        block={blocked}
        onOpenChange={o => !o && setBlocked(null)}
      />
      <ConfirmationDialog
        open={!!deleting}
        onOpenChange={o => !o && setDeleting(null)}
        title={`Remove ${deleting?.display_name ?? 'this group'}?`}
        description="The group and its cadence are removed. The coachees stay on the sandbox and keep their client records with their coaches."
        confirmText="Remove group"
        variant="destructive"
        onConfirm={async () => {
          if (!deleting) return
          try {
            await deleteGroup.mutateAsync(deleting.id)
            setDeleting(null)
          } catch (error) {
            const detail = sandboxErrorDetail(error)
            if (detail?.code !== 'group_has_sessions') throw error
            setBlocked({
              groupName: deleting.display_name,
              sessions: detail.sessions ?? 0,
              coacheeNames: detail.coachee_names ?? [],
            })
            setDeleting(null)
          }
        }}
      />
    </div>
  )
}
