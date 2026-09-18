/**
 * What an invitation is doing, said the same way everywhere.
 *
 * The badge, the "is this person still waiting" test and the promise of what
 * they will see once they accept used to live in the invitations panel. That
 * panel is gone — its work folded into the roster's their-side card, directly
 * under the badges it used to repeat — so the vocabulary lives here instead.
 */

import { fmtDay } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { SandboxMember } from '@/types/sandbox'

/** Nobody has a live invitation for this person: sending one does something. */
export function isWaiting(member: SandboxMember): boolean {
  return (
    member.invitation_status === 'not_sent' ||
    member.invitation_status === 'has_account' ||
    member.invitation_status === 'expired'
  )
}

/**
 * What this person gets once they accept — the thing worth checking in the
 * second before the email goes out.
 */
export function willSee(member: SandboxMember): string {
  if (
    member.roles.includes('primary_client') ||
    member.roles.includes('primary_client_admin')
  ) {
    return 'Vision, timeline, all groups'
  }
  if (member.roles.includes('supervisor')) {
    return member.group_names.length
      ? `${member.group_names.join(', ')} only`
      : 'Their groups, once assigned'
  }
  if (member.group_kinds.includes('coachee')) return 'Their own sessions'
  return 'Nothing yet'
}

/** The their-side card's headline and the line under it. */
export function invitationHeadline(theirs: SandboxMember[]): {
  waiting: SandboxMember[]
  title: string
  detail: string
} {
  const waiting = theirs.filter(isWaiting)
  const accepted = theirs.filter(m => m.invitation_status === 'accepted')
  if (waiting.length > 0) {
    return {
      waiting,
      title:
        waiting.length === 1
          ? 'One person is waiting on an invitation'
          : `${waiting.length} people are waiting on an invitation`,
      detail:
        'Each gets one email with a link that lasts 7 days. Nothing goes out until you send it.',
    }
  }
  return {
    waiting,
    title:
      theirs.length > 0 && accepted.length === theirs.length
        ? 'Everyone has accepted'
        : 'Everyone has been invited',
    detail: 'Links last 7 days. Resend from a row if one runs out.',
  }
}

export function InvitationBadge({ member }: { member: SandboxMember }) {
  const status = member.invitation_status
  // Scoped viewers get invitation fields blanked — show nothing.
  if (status === null) return null
  const cls =
    status === 'sent'
      ? 'bg-indigo-bg text-indigo'
      : status === 'accepted'
        ? 'bg-forest-bg text-forest'
        : status === 'expired'
          ? 'bg-amber-token-bg text-amber-token'
          : status === 'has_account'
            ? 'border border-line text-ink-2'
            : 'bg-surface-3 text-ink-3'
  const label =
    status === 'sent'
      ? `Sent ${fmtDay(member.invited_at?.slice(0, 10))}`
      : status === 'accepted'
        ? 'Accepted'
        : status === 'expired'
          ? 'Expired'
          : status === 'has_account'
            ? 'Has an account'
            : 'Not sent'
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        cls,
      )}
      data-testid="invitation-badge"
    >
      {label}
    </span>
  )
}
