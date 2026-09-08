'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { CommitmentDetailPanel } from '@/components/commitments/commitment-detail-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IdentityCard } from '@/components/sandboxes/rail/identity-card'
import {
  SetupCard,
  type SetupTarget,
} from '@/components/sandboxes/rail/setup-card'
import { LinksCard } from '@/components/sandboxes/rail/links-card'
import { TimelinePanel } from '@/components/sandboxes/timeline-panel'
import { VisionPanel } from '@/components/sandboxes/vision-panel'
import { TeamPanel } from '@/components/sandboxes/team-panel'
import { PeopleTable } from '@/components/sandboxes/people/people-table'
import { AddOurPeopleDialog } from '@/components/sandboxes/add-our-people-dialog'
import { AddTheirPeopleDialog } from '@/components/sandboxes/add-their-people-dialog'
import { ChangeRolesDialog } from '@/components/sandboxes/change-roles-dialog'
import { RemoveMemberDialog } from '@/components/sandboxes/remove-member-dialog'
import { AttentionPanel } from '@/components/sandboxes/attention-panel'
import { IncompleteBanner } from '@/components/sandboxes/incomplete-banner'
import { GroupsPanel } from '@/components/sandboxes/groups-panel'
import { DeliveryPanel } from '@/components/sandboxes/delivery-panel'
import { OutcomesPanel } from '@/components/sandboxes/outcomes/outcomes-panel'
import { CommitmentsPanel } from '@/components/sandboxes/commitments-panel'
import { SettingsPanel } from '@/components/sandboxes/settings-panel'
import { GroupDrawer } from '@/components/sandboxes/group-drawer'
import {
  GroupBlockedDialog,
  type GroupBlock,
} from '@/components/sandboxes/group-blocked-dialog'
import {
  InvitationsPanel,
  isWaiting,
} from '@/components/sandboxes/invitations-panel'
import { EmailPreviewDialog } from '@/components/sandboxes/email-preview-dialog'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import {
  DEFAULT_TAB,
  isSandboxTab,
  TAB_FOR_ANCHOR,
  TAB_LABEL,
  tabsFor,
  type SandboxTab,
} from '@/components/sandboxes/sandbox-tabs'
import { useSandboxDelivery } from '@/hooks/queries/use-sandboxes'
import {
  useDeleteGroup,
  useResendInvitation,
  useRevokeInvitation,
  useSendInvitations,
} from '@/hooks/mutations/use-sandbox-mutations'
import { cn } from '@/lib/utils'
import type {
  SandboxGroup,
  SandboxMember,
  SandboxOverview,
} from '@/types/sandbox'

function scrollTo(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function SandboxCockpit({ overview }: { overview: SandboxOverview }) {
  const sandboxId = overview.sandbox.id
  const view = useSandboxView()
  const router = useRouter()
  const { can } = view
  const tabs = tabsFor(can)

  const [tab, setTab] = useState<SandboxTab>(DEFAULT_TAB)

  // Where a link lands. A `#section` anchor comes from a notification or from
  // the dashboard's attention rows and was written before the tabs existed, so
  // it wins over `?tab=`: pick the tab that owns the section, then scroll to it
  // once that tab has painted — an unmounted section has no element to find.
  //
  // A second link to the same sandbox only changes the hash, which the browser
  // handles without reloading, so the same reading runs again on `hashchange`.
  useEffect(() => {
    let frame = 0
    const land = () => {
      const hash = window.location.hash.slice(1)
      const wanted = TAB_FOR_ANCHOR[hash]
      const params = new URLSearchParams(window.location.search)
      const asked = params.get('tab')
      const next = wanted ?? (isSandboxTab(asked) ? asked : null)
      if (next) setTab(next)
      const deepCommitment = params.get('commitment')
      if (deepCommitment) setOpenCommitmentId(deepCommitment)
      if (!hash) return
      frame = requestAnimationFrame(() =>
        requestAnimationFrame(() => scrollTo(hash)),
      )
    }
    land()
    window.addEventListener('hashchange', land)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('hashchange', land)
    }
  }, [sandboxId])

  // Remember the tab in the URL without navigating: a refresh or a copied link
  // comes back here, and the page keeps its static shell.
  const goToTab = useCallback((next: SandboxTab) => {
    setTab(next)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', next)
    url.hash = ''
    window.history.replaceState(null, '', url)
  }, [])

  /** Switch tab, then scroll to a section inside it. */
  const goToSection = useCallback(
    (anchor: string) => {
      const owner = TAB_FOR_ANCHOR[anchor]
      if (owner) goToTab(owner)
      requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(anchor)))
    },
    [goToTab],
  )

  const [visionOpen, setVisionOpen] = useState(false)
  const [addOurs, setAddOurs] = useState(false)
  const [addTheirs, setAddTheirs] = useState(false)
  const [rolesMember, setRolesMember] = useState<SandboxMember | null>(null)
  const [removeMember, setRemoveMember] = useState<SandboxMember | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerGroup, setDrawerGroup] = useState<SandboxGroup | null>(null)
  const [deleteGroup, setDeleteGroup] = useState<SandboxGroup | null>(null)
  const [blockedGroup, setBlockedGroup] = useState<GroupBlock | null>(null)
  const [previewMemberId, setPreviewMemberId] = useState<string | null>(null)
  const [sendAllOpen, setSendAllOpen] = useState(false)
  const [revokeMember, setRevokeMember] = useState<SandboxMember | null>(null)
  // One commitment panel for the whole page, mounted here rather than inside
  // the Commitments section: a timeline card opens its event's commitment from
  // the Timeline tab, where that section is not mounted at all.
  const [openCommitmentId, setOpenCommitmentId] = useState<string | null>(null)
  const closeCommitment = useCallback(() => {
    setOpenCommitmentId(null)
    const url = new URL(window.location.href)
    if (!url.searchParams.has('commitment') && !url.searchParams.has('comment'))
      return
    url.searchParams.delete('commitment')
    url.searchParams.delete('comment')
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  }, [])

  const sendInvitations = useSendInvitations(sandboxId)
  const resendInvitation = useResendInvitation(sandboxId)
  const revokeInvitation = useRevokeInvitation(sandboxId)
  const deleteGroupMutation = useDeleteGroup(sandboxId)
  // Same query the Delivery panel reads (one request, shared cache) — a group
  // with sessions on record can't be removed, and we say so before asking.
  const { data: delivery } = useSandboxDelivery(sandboxId)

  const askToRemoveGroup = (group: SandboxGroup) => {
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
      setBlockedGroup({
        groupName: group.display_name,
        sessions,
        coacheeNames: withSessions.map(c => c.name ?? c.email),
      })
      return
    }
    setDeleteGroup(group)
  }

  const openDrawer = (group: SandboxGroup | null) => {
    setDrawerGroup(group)
    setDrawerOpen(true)
  }

  // The setup checklist is a table of contents: each step opens the tab that
  // owns the work, and the dialog when there is nothing to look at yet.
  const onSetupSelect = (target: SetupTarget) => {
    const c = overview.checklist
    if (!c) return
    switch (target) {
      case 'term':
        goToTab('timeline')
        break
      case 'vision':
        if (c.vision_added) goToSection('vision')
        else {
          goToTab('general')
          setVisionOpen(true)
        }
        break
      case 'team':
        goToTab('team')
        if (overview.members.length === 0) setAddOurs(true)
        else if (!c.their_side_count) setAddTheirs(true)
        break
      case 'groups':
        if (c.groups.count === 0) openDrawer(null)
        else goToTab('groups')
        break
      case 'invitations':
        goToSection(
          overview.members.some(m => m.side === 'theirs')
            ? 'invitations'
            : 'team',
        )
        break
    }
  }

  // Only the actions the viewer may take become menu items.
  const memberActions = {
    ...(can.editTeam
      ? { onChangeRoles: setRolesMember, onRemove: setRemoveMember }
      : {}),
    ...(can.invite
      ? {
          onInvite: (m: SandboxMember) =>
            sendInvitations.mutate({ member_ids: [m.id] }),
          onResend: (m: SandboxMember) =>
            m.invitation_id && resendInvitation.mutate(m.invitation_id),
          onRevoke: (m: SandboxMember) => setRevokeMember(m),
          onPreview: (m: SandboxMember) => setPreviewMemberId(m.id),
        }
      : {}),
  }

  const waitingCount = overview.members.filter(
    m => m.side === 'theirs' && isWaiting(m),
  ).length
  const sending =
    sendInvitations.isPending ||
    resendInvitation.isPending ||
    revokeInvitation.isPending

  return (
    <div className="space-y-4" data-testid="sandbox-cockpit">
      <IdentityCard overview={overview} onEdit={() => goToTab('settings')} />

      <Tabs
        value={tab}
        onValueChange={v => goToTab(v as SandboxTab)}
        className="gap-4"
      >
        <TabsList
          data-testid="sandbox-tabs"
          className={cn(
            'h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl',
            'border border-line bg-paper p-1',
          )}
        >
          {tabs.map(t => (
            <TabsTrigger
              key={t}
              value={t}
              data-testid={`sandbox-tab-${t}`}
              className={cn(
                'flex-none rounded-lg px-3 py-1.5 text-sm text-ink-3',
                'data-[state=active]:bg-surface-2 data-[state=active]:text-ink',
              )}
            >
              {TAB_LABEL[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          {/* The incomplete-group banner lives on Groups; here the same thing
              arrives as an attention row, so Today stays one list. */}
          <AttentionPanel
            sandboxId={sandboxId}
            onSelect={item => goToSection(item.section)}
          />
          <SetupCard overview={overview} onSelect={onSetupSelect} />
          <CommitmentsPanel
            overview={overview}
            openId={openCommitmentId}
            onOpenChange={setOpenCommitmentId}
          />
        </TabsContent>

        <TabsContent value="outcomes">
          <OutcomesPanel overview={overview} />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          {/* Whoever runs the sandbox gets the full table — filters, bulk
              actions, the lot. Everyone else gets the two-sided roster, which
              is all their capabilities allow them to see. */}
          {can.seePeople ? (
            <PeopleTable
              overview={overview}
              actions={{
                ...memberActions,
                onAddOurs: () => setAddOurs(true),
                onAddTheirs: () => setAddTheirs(true),
              }}
            />
          ) : (
            <TeamPanel
              overview={overview}
              actions={memberActions}
              onAddOurs={() => setAddOurs(true)}
              onAddTheirs={() => setAddTheirs(true)}
            />
          )}
          {can.invite && (
            <InvitationsPanel
              overview={overview}
              actions={{
                onInvite: m => sendInvitations.mutate({ member_ids: [m.id] }),
                onResend: m =>
                  m.invitation_id && resendInvitation.mutate(m.invitation_id),
                onRevoke: m => setRevokeMember(m),
                onPreview: m => setPreviewMemberId(m.id),
                onSendAll: () => setSendAllOpen(true),
                sending,
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          {can.editGroups && (
            <IncompleteBanner
              groups={overview.groups}
              onFinish={g => openDrawer(g)}
            />
          )}
          <GroupsPanel
            overview={overview}
            onNew={() => openDrawer(null)}
            onEdit={g => openDrawer(g)}
            onDelete={askToRemoveGroup}
          />
          <DeliveryPanel overview={overview} />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelinePanel
            overview={overview}
            onOpenCommitment={setOpenCommitmentId}
          />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <VisionPanel
            overview={overview}
            open={visionOpen}
            onOpenChange={setVisionOpen}
          />
          <LinksCard overview={overview} />
        </TabsContent>

        {can.editSandbox && (
          <TabsContent value="settings">
            <SettingsPanel overview={overview} />
          </TabsContent>
        )}
      </Tabs>

      <CommitmentDetailPanel
        commitmentId={openCommitmentId}
        onClose={closeCommitment}
        onNavigate={setOpenCommitmentId}
        onOpenInPage={
          view.audience === 'ours' && openCommitmentId
            ? () => router.push(`/commitments/${openCommitmentId}`)
            : undefined
        }
      />

      {/* Dialogs and drawers — mounted only for people who may use them */}
      {can.editTeam && (
        <>
          <AddOurPeopleDialog
            open={addOurs}
            onOpenChange={setAddOurs}
            sandboxId={sandboxId}
          />
          <AddTheirPeopleDialog
            open={addTheirs}
            onOpenChange={setAddTheirs}
            sandboxId={sandboxId}
            organisation={overview.sandbox.organisation}
            onEditExisting={memberId => {
              const m = overview.members.find(x => x.id === memberId)
              if (m) {
                setAddTheirs(false)
                setRolesMember(m)
              }
            }}
          />
          <ChangeRolesDialog
            member={rolesMember}
            onOpenChange={o => !o && setRolesMember(null)}
            sandboxId={sandboxId}
          />
          <RemoveMemberDialog
            member={removeMember}
            onOpenChange={o => !o && setRemoveMember(null)}
            sandboxId={sandboxId}
          />
        </>
      )}
      {can.editGroups && (
        <GroupDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          overview={overview}
          group={drawerGroup}
        />
      )}
      {can.invite && (
        <EmailPreviewDialog
          sandboxId={sandboxId}
          memberId={previewMemberId}
          onOpenChange={o => !o && setPreviewMemberId(null)}
        />
      )}

      <GroupBlockedDialog
        block={blockedGroup}
        onOpenChange={o => !o && setBlockedGroup(null)}
      />
      <ConfirmationDialog
        open={!!deleteGroup}
        onOpenChange={o => !o && setDeleteGroup(null)}
        title={`Remove ${deleteGroup?.display_name ?? 'this group'}?`}
        description="The group and its cadence are removed. The coachees stay on the sandbox and keep their client records with their coaches."
        confirmText="Remove group"
        variant="destructive"
        onConfirm={async () => {
          if (deleteGroup) await deleteGroupMutation.mutateAsync(deleteGroup.id)
          setDeleteGroup(null)
        }}
      />
      <ConfirmationDialog
        open={sendAllOpen}
        onOpenChange={setSendAllOpen}
        title={`Send ${waitingCount === 1 ? 'the invitation' : `all ${waitingCount} invitations`}?`}
        description="Each person gets one email with a link that lasts 7 days. People who already have a live invitation are skipped."
        confirmText="Send"
        onConfirm={async () => {
          await sendInvitations.mutateAsync({ all_pending: true })
          setSendAllOpen(false)
        }}
      />
      <ConfirmationDialog
        open={!!revokeMember}
        onOpenChange={o => !o && setRevokeMember(null)}
        title={`Revoke the invitation for ${revokeMember?.name || revokeMember?.email || ''}?`}
        description="Their link stops working. You can send a fresh one later."
        confirmText="Revoke"
        variant="destructive"
        onConfirm={async () => {
          if (revokeMember?.invitation_id)
            await revokeInvitation.mutateAsync(revokeMember.invitation_id)
          setRevokeMember(null)
        }}
      />
    </div>
  )
}
