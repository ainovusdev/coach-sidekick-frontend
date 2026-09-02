'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import {
  MemberRow,
  type MemberActions,
} from '@/components/sandboxes/member-row'
import type { SandboxMember, SandboxOverview } from '@/types/sandbox'

export function TeamPanel({
  overview,
  actions,
  onAddOurs,
  onAddTheirs,
}: {
  overview: SandboxOverview
  actions: MemberActions
  onAddOurs: () => void
  onAddTheirs: () => void
}) {
  const { user } = useAuth()
  const { members, sandbox } = overview
  const ours = members.filter(m => m.side === 'ours')
  const theirs = members.filter(m => m.side === 'theirs')
  const anyoneInvited = theirs.some(
    m => m.invitation_status === 'sent' || m.invitation_status === 'accepted',
  )

  return (
    <section
      id="team"
      className="scroll-mt-6 rounded-xl border border-line bg-paper"
      data-testid="team-panel"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink">
          Team{' '}
          <span className="ml-1 text-sm font-normal text-ink-3">
            {members.length}
          </span>
        </h2>
        <span className="flex items-center gap-3 text-xs text-ink-3">
          {anyoneInvited
            ? 'Invitations are managed below'
            : 'No one is emailed yet'}
          <Link
            href={`/admin/sandboxes/${sandbox.id}/people`}
            className="font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline"
            data-testid="people-link"
          >
            All people →
          </Link>
        </span>
      </header>

      <div className="grid gap-x-8 gap-y-6 px-5 py-4 md:grid-cols-2">
        <SideColumn
          title="Our side"
          subtitle="Novus"
          members={ours}
          actions={actions}
          selfId={user?.id}
          footer="Add from our people"
          onAdd={onAddOurs}
          empty="No one from our side yet."
          testId="our-side"
        />
        <SideColumn
          title="Their side"
          subtitle={theirs.length ? sandbox.organisation : 'None invited yet'}
          members={theirs}
          actions={actions}
          selfId={user?.id}
          footer="Add by email"
          onAdd={onAddTheirs}
          empty={`No one from ${sandbox.organisation} yet.`}
          testId="their-side"
        />
      </div>
    </section>
  )
}

function SideColumn({
  title,
  subtitle,
  members,
  actions,
  selfId,
  footer,
  onAdd,
  empty,
  testId,
}: {
  title: string
  subtitle: string
  members: SandboxMember[]
  actions: MemberActions
  selfId?: string
  footer: string
  onAdd: () => void
  empty: string
  testId: string
}) {
  return (
    <div data-testid={testId}>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        {title} <span className="text-ink-4">· {subtitle}</span>
      </h3>
      {members.length === 0 ? (
        <p className="mt-3 text-sm text-ink-3">{empty}</p>
      ) : (
        <ul className="mt-1 divide-y divide-line">
          {members.map(m => (
            <MemberRow
              key={m.id}
              member={m}
              actions={actions}
              isSelf={m.user_id === selfId}
            />
          ))}
        </ul>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 -ml-2 h-8 text-ink-2"
        onClick={onAdd}
      >
        <Plus className="h-4 w-4" />
        {footer}
      </Button>
    </div>
  )
}
