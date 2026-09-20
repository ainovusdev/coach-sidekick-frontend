'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { GroupDrawer } from '@/components/sandboxes/group-drawer'
import {
  GroupBlockedDialog,
  type GroupBlock,
} from '@/components/sandboxes/group-blocked-dialog'
import { AddPairingsSheet } from '@/components/sandboxes/groups/add-pairings-sheet'
import { PairingsTable } from '@/components/sandboxes/groups/pairings-table'
import { rosterOf } from '@/components/sandboxes/groups/roster-picker'
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
 * Who works with whom: 1:1 pairings first, then the many-to-many groups.
 *
 * Both only arrange people who are already on People's lists, so nothing new
 * can be started until there is at least one coach and one coachee there. What
 * already exists stays open to edit either way — an unfinished group must be
 * fixable even when a list has emptied. The drawer, the sheet and the dialogs
 * live here rather than in the page shell: nothing outside opens them.
 */
export function GroupsSection({
  overview,
  onGoToPeople,
}: {
  overview: SandboxOverview
  onGoToPeople?: () => void
}) {
  const sandboxId = overview.sandbox.id
  const { can } = useSandboxView()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerGroup, setDrawerGroup] = useState<SandboxGroup | null>(null)
  const [drawerTemplate, setDrawerTemplate] = useState<SandboxGroup | null>(
    null,
  )
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetTemplate, setSheetTemplate] = useState<SandboxGroup | null>(null)
  const [deleting, setDeleting] = useState<SandboxGroup | null>(null)
  const [blocked, setBlocked] = useState<GroupBlock | null>(null)
  const deleteGroup = useDeleteGroup(sandboxId)

  // The same query the roster reads (one request, shared cache) — a group with
  // sessions on record can't be removed, and we say so before asking.
  const { data: delivery } = useSandboxDelivery(sandboxId)

  const pairings = overview.groups.filter(g => g.kind === 'pair')
  const manyToMany = overview.groups.filter(g => g.kind !== 'pair')
  const noCoach = rosterOf(overview.members, 'coach').length === 0
  const noCoachee = rosterOf(overview.members, 'coachee').length === 0
  const createBlocked = noCoach || noCoachee
  const addPeople = can.editTeam ? onGoToPeople : undefined

  const openDrawer = (
    group: SandboxGroup | null,
    template: SandboxGroup | null = null,
  ) => {
    setDrawerGroup(group)
    setDrawerTemplate(template)
    setDrawerOpen(true)
  }
  const openSheet = (template: SandboxGroup | null = null) => {
    setSheetTemplate(template)
    setSheetOpen(true)
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
        <IncompleteBanner
          groups={overview.groups}
          onFinish={g => openDrawer(g)}
        />
      )}
      {can.editGroups && createBlocked && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-line bg-paper px-5 py-4 sm:flex-row sm:items-center"
          role="status"
          data-testid="groups-gate"
        >
          <Users className="h-5 w-5 shrink-0 text-ink-3" />
          <p className="flex-1 text-sm text-ink-2">
            <span className="font-medium text-ink">
              Add at least one coach and one coachee on People first.
            </span>{' '}
            {noCoach && noCoachee
              ? 'Pairings and groups are made from those two lists.'
              : noCoach
                ? 'There are coachees, but no coach to pair them with yet.'
                : 'There are coaches, but no coachee to pair them with yet.'}
          </p>
          {onGoToPeople && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGoToPeople}
              data-testid="groups-gate-people"
            >
              Go to People
            </Button>
          )}
        </div>
      )}
      <PairingsTable
        pairings={pairings}
        createBlocked={createBlocked}
        onAdd={() => openSheet()}
        onEdit={g => openDrawer(g)}
        onDuplicate={openSheet}
        onDelete={askToRemove}
      />
      <GroupsPanel
        groups={manyToMany}
        createBlocked={createBlocked}
        onNew={() => openDrawer(null)}
        onEdit={g => openDrawer(g)}
        onDuplicate={g => openDrawer(null, g)}
        onDelete={askToRemove}
      />

      {can.editGroups && (
        <>
          <GroupDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            overview={overview}
            group={drawerGroup}
            template={drawerTemplate}
            onAddPeople={addPeople}
          />
          <AddPairingsSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            overview={overview}
            template={sheetTemplate}
            onAddPeople={addPeople}
          />
        </>
      )}
      <GroupBlockedDialog
        block={blocked}
        onOpenChange={o => !o && setBlocked(null)}
      />
      <ConfirmationDialog
        open={!!deleting}
        onOpenChange={o => !o && setDeleting(null)}
        title={`Remove ${deleting?.display_name ?? 'this group'}?`}
        description="It and its cadence are removed. The coachees stay on the sandbox and keep their client records with their coaches."
        confirmText={
          deleting?.kind === 'pair' ? 'Remove pairing' : 'Remove group'
        }
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
