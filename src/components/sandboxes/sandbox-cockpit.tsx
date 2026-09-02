'use client'

import { useState } from 'react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { IdentityCard } from '@/components/sandboxes/rail/identity-card'
import {
  SetupCard,
  type SetupTarget,
} from '@/components/sandboxes/rail/setup-card'
import { LinksCard } from '@/components/sandboxes/rail/links-card'
import { TimelinePanel } from '@/components/sandboxes/timeline-panel'
import { VisionPanel } from '@/components/sandboxes/vision-panel'
import { TeamPanel } from '@/components/sandboxes/team-panel'
import { AddOurPeopleDialog } from '@/components/sandboxes/add-our-people-dialog'
import { AddTheirPeopleDialog } from '@/components/sandboxes/add-their-people-dialog'
import { ChangeRolesDialog } from '@/components/sandboxes/change-roles-dialog'
import { RemoveMemberDialog } from '@/components/sandboxes/remove-member-dialog'
import { IncompleteBanner } from '@/components/sandboxes/incomplete-banner'
import { GroupsPanel } from '@/components/sandboxes/groups-panel'
import { GroupDrawer } from '@/components/sandboxes/group-drawer'
import {
  InvitationsPanel,
  isWaiting,
} from '@/components/sandboxes/invitations-panel'
import { EmailPreviewDialog } from '@/components/sandboxes/email-preview-dialog'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
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
  const { can } = view
  const [visionOpen, setVisionOpen] = useState(false)
  const [addOurs, setAddOurs] = useState(false)
  const [addTheirs, setAddTheirs] = useState(false)
  const [rolesMember, setRolesMember] = useState<SandboxMember | null>(null)
  const [removeMember, setRemoveMember] = useState<SandboxMember | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerGroup, setDrawerGroup] = useState<SandboxGroup | null>(null)
  const [deleteGroup, setDeleteGroup] = useState<SandboxGroup | null>(null)
  const [previewMemberId, setPreviewMemberId] = useState<string | null>(null)
  const [sendAllOpen, setSendAllOpen] = useState(false)
  const [revokeMember, setRevokeMember] = useState<SandboxMember | null>(null)

  const sendInvitations = useSendInvitations(sandboxId)
  const resendInvitation = useResendInvitation(sandboxId)
  const revokeInvitation = useRevokeInvitation(sandboxId)
  const deleteGroupMutation = useDeleteGroup(sandboxId)

  const openDrawer = (group: SandboxGroup | null) => {
    setDrawerGroup(group)
    setDrawerOpen(true)
  }

  const onSetupSelect = (target: SetupTarget) => {
    const c = overview.checklist
    if (!c) return
    switch (target) {
      case 'term':
        scrollTo('timeline')
        break
      case 'vision':
        if (c.vision_added) scrollTo('vision')
        else setVisionOpen(true)
        break
      case 'team':
        scrollTo('team')
        if (overview.members.length === 0) setAddOurs(true)
        else if (!c.their_side_count) setAddTheirs(true)
        break
      case 'groups':
        if (c.groups.count === 0) openDrawer(null)
        else scrollTo('groups')
        break
      case 'invitations':
        scrollTo(
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
    <div
      className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]"
      data-testid="sandbox-cockpit"
    >
      <aside
        className={cn('space-y-4 xl:sticky xl:self-start', view.railTopClass)}
      >
        <IdentityCard overview={overview} />
        <SetupCard overview={overview} onSelect={onSetupSelect} />
        <LinksCard overview={overview} />
      </aside>

      <div className="min-w-0 space-y-6">
        {can.editGroups && (
          <IncompleteBanner
            groups={overview.groups}
            onFinish={g => openDrawer(g)}
          />
        )}
        <TimelinePanel overview={overview} />
        <VisionPanel
          overview={overview}
          open={visionOpen}
          onOpenChange={setVisionOpen}
        />
        <TeamPanel
          overview={overview}
          actions={memberActions}
          onAddOurs={() => setAddOurs(true)}
          onAddTheirs={() => setAddTheirs(true)}
        />
        <GroupsPanel
          overview={overview}
          onNew={() => openDrawer(null)}
          onEdit={g => openDrawer(g)}
          onDelete={setDeleteGroup}
        />
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
      </div>

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
