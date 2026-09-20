'use client'

import { useState } from 'react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { AddCoachesDialog } from '@/components/sandboxes/add-coaches-dialog'
import { AddOurPeopleDialog } from '@/components/sandboxes/add-our-people-dialog'
import { AddTheirPeopleDialog } from '@/components/sandboxes/add-their-people-dialog'
import { ChangeRolesDialog } from '@/components/sandboxes/change-roles-dialog'
import { EmailPreviewDialog } from '@/components/sandboxes/email-preview-dialog'
import { PeopleTable } from '@/components/sandboxes/people/people-table'
import { RemoveFromListDialog } from '@/components/sandboxes/people/remove-from-list-dialog'
import { RemoveMemberDialog } from '@/components/sandboxes/remove-member-dialog'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { TeamPanel } from '@/components/sandboxes/team-panel'
import {
  useResendInvitation,
  useRevokeInvitation,
  useSendInvitations,
  useSetMemberRoster,
} from '@/hooks/mutations/use-sandbox-mutations'
import type {
  RosterKind,
  SandboxMember,
  SandboxOverview,
} from '@/types/sandbox'

/**
 * Everyone on the sandbox, in three lists: the managing team, the coaches, and
 * the client's own people.
 *
 * This tab decides who is here; Groups only arranges them. All of it — the
 * dialogs, the invitation mutations — belongs to this tab, so the page shell
 * keeps none of it.
 */
export function PeopleTab({ overview }: { overview: SandboxOverview }) {
  const sandboxId = overview.sandbox.id
  const { can } = useSandboxView()

  const [addOurs, setAddOurs] = useState(false)
  const [addTheirs, setAddTheirs] = useState(false)
  const [addCoaches, setAddCoaches] = useState(false)
  const [addOurCoachees, setAddOurCoachees] = useState(false)
  const [offList, setOffList] = useState<{
    member: SandboxMember
    kind: RosterKind
  } | null>(null)
  const [rolesMember, setRolesMember] = useState<SandboxMember | null>(null)
  const [removeMember, setRemoveMember] = useState<SandboxMember | null>(null)
  const [previewMemberId, setPreviewMemberId] = useState<string | null>(null)
  const [revokeMember, setRevokeMember] = useState<SandboxMember | null>(null)

  const sendInvitations = useSendInvitations(sandboxId)
  const resendInvitation = useResendInvitation(sandboxId)
  const revokeInvitation = useRevokeInvitation(sandboxId)
  const setRoster = useSetMemberRoster(sandboxId)

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
      {/* Whoever runs the sandbox gets the full table — filters, bulk actions,
          invitations. Everyone else gets the two-sided roster, which is all
          their capabilities allow them to see. */}
      {can.seePeople ? (
        <PeopleTable
          overview={overview}
          actions={{
            ...actions,
            onAddOurs: () => setAddOurs(true),
            onAddCoaches: () => setAddCoaches(true),
            onAddTheirs: () => setAddTheirs(true),
            onAddOurCoachees: () => setAddOurCoachees(true),
            ...(can.editTeam
              ? {
                  onAddToList: (member: SandboxMember, kind: RosterKind) =>
                    setRoster.mutate({
                      memberId: member.id,
                      data: { roster: [...member.roster, kind] },
                    }),
                  onRemoveFromList: (member: SandboxMember, kind: RosterKind) =>
                    setOffList({ member, kind }),
                }
              : {}),
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
          <AddCoachesDialog
            open={addCoaches}
            onOpenChange={setAddCoaches}
            sandboxId={sandboxId}
          />
          <AddCoachesDialog
            open={addOurCoachees}
            onOpenChange={setAddOurCoachees}
            sandboxId={sandboxId}
            kind="coachee"
          />
          <RemoveFromListDialog
            target={offList}
            onOpenChange={o => !o && setOffList(null)}
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
