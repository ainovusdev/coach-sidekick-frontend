'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { fmtDay, pluralise } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { SandboxMember, SandboxOverview } from '@/types/sandbox'

export interface InvitationActions {
  onInvite: (member: SandboxMember) => void
  onResend: (member: SandboxMember) => void
  onRevoke: (member: SandboxMember) => void
  onPreview: (member: SandboxMember) => void
  onSendAll: () => void
  sending: boolean
}

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

export function isWaiting(member: SandboxMember): boolean {
  return (
    member.invitation_status === 'not_sent' ||
    member.invitation_status === 'has_account' ||
    member.invitation_status === 'expired'
  )
}

export function InvitationsPanel({
  overview,
  actions,
}: {
  overview: SandboxOverview
  actions: InvitationActions
}) {
  const [showAll, setShowAll] = useState(false)
  const view = useSandboxView()
  const theirs = overview.members.filter(m => m.side === 'theirs')
  // Sending is the account executive's job; nobody else gets the table.
  if (!view.can.seeInvitations || theirs.length === 0) return null

  const waiting = theirs.filter(isWaiting)
  const accepted = theirs.filter(m => m.invitation_status === 'accepted')
  const ordered = [...theirs].sort(
    (a, b) => Number(isWaiting(b)) - Number(isWaiting(a)),
  )
  const LIMIT = 6
  const rows = showAll ? ordered : ordered.slice(0, LIMIT)
  const hidden = ordered.length - rows.length

  const title =
    waiting.length > 0
      ? `${waiting.length === 1 ? 'One person is' : `${waiting.length} people are`} waiting on an invitation`
      : accepted.length === theirs.length
        ? 'Everyone has accepted'
        : 'Everyone has been invited'
  const subtitle =
    waiting.length > 0
      ? 'Each person gets one email with a link that lasts 7 days. Nothing goes out until you send it.'
      : 'Links last 7 days. Resend from the row if one runs out.'

  return (
    <section
      id="invitations"
      className="scroll-mt-6 rounded-xl border border-line bg-paper"
      data-testid="invitations-panel"
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-4">
        <div>
          <h2
            className="text-base font-semibold text-ink"
            data-testid="invitations-title"
          >
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>
        </div>
        {waiting.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onPreview(waiting[0])}
              data-testid="preview-email"
            >
              Preview email
            </Button>
            <Button
              size="sm"
              className="bg-ink text-ink-on-dark hover:bg-ink/90"
              disabled={actions.sending}
              onClick={actions.onSendAll}
              data-testid="send-all"
            >
              {actions.sending ? 'Sending…' : `Send all ${waiting.length}`}
            </Button>
          </div>
        )}
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              <th className="px-5 py-2.5 font-semibold">Person</th>
              <th className="px-3 py-2.5 font-semibold">
                Role in this sandbox
              </th>
              <th className="px-3 py-2.5 font-semibold">Will see</th>
              <th className="px-5 py-2.5 font-semibold">Invitation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(m => (
              <tr key={m.id} data-testid="invitation-row" data-email={m.email}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <PersonAvatar
                      name={m.name}
                      email={m.email}
                      dashed={isWaiting(m)}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">
                        {m.name || m.email}
                      </p>
                      <p className="truncate text-xs text-ink-3">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-ink-2">
                  {m.role_labels.join(', ') || '—'}
                </td>
                <td className="px-3 py-3 text-ink-3">{willSee(m)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <InvitationBadge member={m} />
                    <RowActions member={m} actions={actions} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full border-t border-line px-5 py-2.5 text-left text-xs text-ink-2 hover:bg-surface-2"
        >
          + {pluralise(hidden, 'more person', 'more people')} · Show all
        </button>
      )}
    </section>
  )
}

function RowActions({
  member,
  actions,
}: {
  member: SandboxMember
  actions: InvitationActions
}) {
  const status = member.invitation_status
  const link = 'text-xs text-ds-accent hover:underline disabled:opacity-50'
  return (
    <span className="flex items-center gap-2">
      {(status === 'not_sent' || status === 'has_account') && (
        <button
          type="button"
          className={link}
          disabled={actions.sending}
          onClick={() => actions.onInvite(member)}
          data-testid="invite-one"
        >
          Invite
        </button>
      )}
      {(status === 'sent' || status === 'expired') && (
        <button
          type="button"
          className={link}
          disabled={actions.sending}
          onClick={() => actions.onResend(member)}
          data-testid="resend-one"
        >
          Resend
        </button>
      )}
      {status === 'sent' && (
        <button
          type="button"
          className={cn(link, 'text-ink-3')}
          disabled={actions.sending}
          onClick={() => actions.onRevoke(member)}
          data-testid="revoke-one"
        >
          Revoke
        </button>
      )}
    </span>
  )
}
