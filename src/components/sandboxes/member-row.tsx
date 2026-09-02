'use client'

import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { fmtDay } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { SandboxMember } from '@/types/sandbox'

/** Every handler is optional: a read-only viewer passes none and gets no menu. */
export interface MemberActions {
  onChangeRoles?: (member: SandboxMember) => void
  onRemove?: (member: SandboxMember) => void
  onInvite?: (member: SandboxMember) => void
  onResend?: (member: SandboxMember) => void
  onRevoke?: (member: SandboxMember) => void
  onPreview?: (member: SandboxMember) => void
}

export function isUninvited(member: SandboxMember): boolean {
  return (
    member.side === 'theirs' &&
    (member.invitation_status === 'not_sent' ||
      member.invitation_status === 'has_account' ||
      member.invitation_status === 'expired')
  )
}

export function invitationText(member: SandboxMember): string | null {
  if (member.side !== 'theirs') return null
  switch (member.invitation_status) {
    case 'sent':
      return `Invited ${fmtDay(member.invited_at?.slice(0, 10))}`
    case 'accepted':
      return 'Has access'
    case 'expired':
      return 'Invitation expired'
    case 'has_account':
      return 'Has an account · not yet connected'
    case 'not_sent':
      return 'Not yet invited'
    default:
      // Scoped viewers get invitation fields blanked — say nothing.
      return null
  }
}

export function MemberRow({
  member,
  actions,
  isSelf,
}: {
  member: SandboxMember
  actions: MemberActions
  isSelf?: boolean
}) {
  const roleText = member.role_labels.length
    ? member.role_labels.join(' · ')
    : 'No role yet'
  const invite = invitationText(member)
  const uninvited = isUninvited(member)

  const theirs = member.side === 'theirs'
  const inviteItems: React.ReactNode[] = []
  if (theirs) {
    if (
      (member.invitation_status === 'not_sent' ||
        member.invitation_status === 'has_account') &&
      actions.onInvite
    )
      inviteItems.push(
        <DropdownMenuItem
          key="invite"
          onClick={() => actions.onInvite!(member)}
        >
          Send invitation
        </DropdownMenuItem>,
      )
    if (
      (member.invitation_status === 'sent' ||
        member.invitation_status === 'expired') &&
      actions.onResend
    )
      inviteItems.push(
        <DropdownMenuItem
          key="resend"
          onClick={() => actions.onResend!(member)}
        >
          Resend invitation
        </DropdownMenuItem>,
      )
    if (member.invitation_status === 'sent' && actions.onRevoke)
      inviteItems.push(
        <DropdownMenuItem
          key="revoke"
          onClick={() => actions.onRevoke!(member)}
        >
          Revoke invitation
        </DropdownMenuItem>,
      )
    if (member.invitation_status !== 'accepted' && actions.onPreview)
      inviteItems.push(
        <DropdownMenuItem
          key="preview"
          onClick={() => actions.onPreview!(member)}
        >
          Preview email
        </DropdownMenuItem>,
      )
  }
  const hasMenu =
    !!actions.onChangeRoles || !!actions.onRemove || inviteItems.length > 0

  return (
    <li
      className="flex items-center gap-3 py-2.5"
      data-testid="member-row"
      data-email={member.email}
    >
      <PersonAvatar
        name={member.name}
        email={member.email}
        dashed={uninvited}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          {member.name || member.email}
          {isSelf && (
            <span className="ml-1.5 text-xs font-normal text-ink-3">(you)</span>
          )}
        </p>
        <p className="truncate text-xs text-ink-3">
          {roleText}
          {invite && (
            <>
              <span className="mx-1">·</span>
              <span
                className={cn(
                  member.invitation_status === 'expired' && 'text-amber-token',
                )}
              >
                {invite}
              </span>
            </>
          )}
        </p>
      </div>
      {hasMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-ink-3"
              aria-label={`Actions for ${member.name || member.email}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {actions.onChangeRoles && (
              <DropdownMenuItem onClick={() => actions.onChangeRoles!(member)}>
                Change roles
              </DropdownMenuItem>
            )}
            {inviteItems.length > 0 && (
              <>
                {actions.onChangeRoles && <DropdownMenuSeparator />}
                {inviteItems}
              </>
            )}
            {actions.onRemove && (
              <>
                {(actions.onChangeRoles || inviteItems.length > 0) && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuItem
                  className="text-vermillion focus:text-vermillion"
                  onClick={() => actions.onRemove!(member)}
                >
                  Remove from sandbox
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  )
}
