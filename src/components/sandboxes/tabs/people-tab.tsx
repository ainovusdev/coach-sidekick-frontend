'use client'

import { useState } from 'react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { AddOurPeopleDialog } from '@/components/sandboxes/add-our-people-dialog'
import { AddTheirPeopleDialog } from '@/components/sandboxes/add-their-people-dialog'
import { ChangeRolesDialog } from '@/components/sandboxes/change-roles-dialog'
import { EmailPreviewDialog } from '@/components/sandboxes/email-preview-dialog'
import { GroupsSection } from '@/components/sandboxes/groups/groups-section'
import { PeopleTable } from '@/components/sandboxes/people/people-table'
import { RemoveMemberDialog } from '@/components/sandboxes/remove-member-dialog'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { TeamPanel } from '@/components/sandboxes/team-panel'
import {
  useResendInvitation,
  useRevokeInvitation,
  useSendInvitations,
} from '@/hooks/mutations/use-sandbox-mutations'
import type { SandboxMember, SandboxOverview } from '@/types/sandbox'

/**
 * Everyone on the sandbox, and how they are arranged.
 *
 * Groups come first because a group is what makes a coachee measurable, and
 * finishing one is the commonest unfinished job; the roster underneath is where
 * people are added, invited and given their hats. All of it — the four dialogs,
 * the invitation mutations — belongs to this tab, so the page shell keeps none
 * of it.
 */
export function PeopleTab({ overview }: { overview: SandboxOverview }) {
  const sandboxId = overview.sandbox.id
  const { can } = useSandboxView()

  const [addOurs, setAddOurs] = useState(false)
  const [addTheirs, setAddTheirs] = useState(false)
  const [rolesMember, setRolesMember] = useState<SandboxMember | null>(null)
  const [removeMember, setRemoveMember] = useState<SandboxMember | null>(null)
  const [previewMemberId, setPreviewMemberId] = useState<string | null>(null)
  const [revokeMember, setRevokeMember] = useState<SandboxMember | null>(null)

  const sendInvitations = useSendInvitations(sandboxId)
  const resendInvitation = useResendInvitation(sandboxId)
  const revokeInvitation = useRevokeInvitation(sandboxId)

  // Only the actions the viewer may take become menu items.
  const actions = {
    ...(can.editTeam
      ? { onChangeRoles: setRolesMember, onRemove: setRemoveMember }
      : {}),
    ...(can.invite
      ? {
          onInvite: (m: SandboxMember) =>
            sendInvitations.mutate({ member_ids: [m.id] }),
          onResend: (m: SandboxMember) =>
            m.invitation_id && resendInvitation.mutate(m.invitation_id),
          onRevoke: setRevokeMember,
          onPreview: (m: SandboxMember) => setPreviewMemberId(m.id),
        }
      : {}),
  }

  return (
    <div className="space-y-4">
      <GroupsSection overview={overview} />

      {/* Whoever runs the sandbox gets the full table — filters, bulk actions,
          invitations. Everyone else gets the two-sided roster, which is all
          their capabilities allow them to see. */}
      {can.seePeople ? (
        <PeopleTable
          overview={overview}
          actions={{
            ...actions,
            onAddOurs: () => setAddOurs(true),
            onAddTheirs: () => setAddTheirs(true),
          }}
        />
      ) : (
        <TeamPanel
          overview={overview}
          actions={actions}
          onAddOurs={() => setAddOurs(true)}
          onAddTheirs={() => setAddTheirs(true)}
        />
      )}

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
      {can.invite && (
        <>
          <EmailPreviewDialog
            sandboxId={sandboxId}
            memberId={previewMemberId}
            onOpenChange={o => !o && setPreviewMemberId(null)}
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
        </>
      )}
    </div>
  )
}
