'use client'

import { useMemo, useState } from 'react'
import { MoreHorizontal, Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/ui/person-avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/contexts/auth-context'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { EmailPreviewDialog } from '@/components/sandboxes/email-preview-dialog'
import {
  InvitationBadge,
  isWaiting,
} from '@/components/sandboxes/invitations-panel'
import type { MemberActions } from '@/components/sandboxes/member-row'
import { ChangeGroupsDialog } from '@/components/sandboxes/people/change-groups-dialog'
import { BulkRemoveDialog } from '@/components/sandboxes/people/bulk-remove-dialog'
import { useSandboxDelivery } from '@/hooks/queries/use-sandboxes'
import {
  useSendInvitations,
  useResendAddedEmail,
} from '@/hooks/mutations/use-sandbox-mutations'
import { fmtDay, pluralise } from '@/lib/sandbox/format'
import { toDateOnly } from '@/lib/sandbox/term'
import { cn } from '@/lib/utils'
import type {
  InvitationStatus,
  SandboxMember,
  SandboxOverview,
} from '@/types/sandbox'

const ROLE_OPTIONS: {
  value: string
  label: string
  side: 'ours' | 'theirs'
}[] = [
  { value: 'account_executive', label: 'Account executive', side: 'ours' },
  { value: 'sandbox_owner', label: 'Sandbox owner', side: 'ours' },
  { value: 'lead_coach', label: 'Lead coach', side: 'ours' },
  { value: 'coach', label: 'Coach', side: 'ours' },
  { value: 'primary_client', label: 'Primary client', side: 'theirs' },
  {
    value: 'primary_client_admin',
    label: 'Primary client admin',
    side: 'theirs',
  },
  { value: 'supervisor', label: 'Supervisor', side: 'theirs' },
  { value: 'coachee', label: 'Coachee', side: 'theirs' },
]

const INVITATION_OPTIONS: { value: InvitationStatus; label: string }[] = [
  { value: 'not_sent', label: 'Not sent' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'expired', label: 'Expired' },
  { value: 'has_account', label: 'Has an account' },
]

type SideFilter = 'all' | 'ours' | 'theirs'

export type PeopleTableActions = MemberActions & {
  onAddOurs: () => void
  onAddTheirs: () => void
}

/** Hats plus the derived coach/coachee, as the chips a row shows. */
function roleChips(
  member: SandboxMember,
): { label: string; derived: boolean }[] {
  const chips = member.roles.map(r => ({
    label: ROLE_OPTIONS.find(o => o.value === r)?.label ?? r,
    derived: false,
  }))
  for (const kind of member.group_kinds) {
    if (kind === 'coach' || kind === 'coachee') {
      chips.push({
        label: kind === 'coach' ? 'Coach' : 'Coachee',
        derived: true,
      })
    }
  }
  return chips
}

function groupsText(member: SandboxMember): string {
  const parts = member.memberships.map(m =>
    m.kind === 'supervisor' ? `${m.group_name} (supervises)` : m.group_name,
  )
  return Array.from(new Set(parts)).join(', ')
}

/**
 * Everyone on the sandbox, as the Team tab shows them to whoever runs it.
 *
 * This was a page of its own until the sandbox became tabbed; folding it in
 * means one list rather than a roster and a table saying the same thing twice.
 * The dialogs the cockpit already owns arrive as `actions` — only the ones it
 * has no use for elsewhere (groups, bulk removal, bulk invitations) live here.
 */
export function PeopleTable({
  overview,
  actions,
}: {
  overview: SandboxOverview
  actions: PeopleTableActions
}) {
  const { user } = useAuth()
  const { can } = useSandboxView()
  const { sandbox, members, groups } = overview
  const sandboxId = sandbox.id
  const resendAdded = useResendAddedEmail(sandboxId)
  const sendInvitations = useSendInvitations(sandboxId)
  const [addedPreviewId, setAddedPreviewId] = useState<string | null>(null)

  // Sessions on record per coachee — what bulk removal has to mention.
  const { data: delivery } = useSandboxDelivery(sandboxId)
  const sessionsByMember = useMemo(() => {
    const out: Record<string, number> = {}
    for (const g of delivery?.groups ?? [])
      for (const c of g.coachees)
        out[c.member_id] =
          (out[c.member_id] ?? 0) + c.delivered.sessions + c.delivered.in_flight
    return out
  }, [delivery])

  const [search, setSearch] = useState('')
  const [side, setSide] = useState<SideFilter>('all')
  const [role, setRole] = useState('all')
  const [group, setGroup] = useState('all')
  const [invitation, setInvitation] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [groupsMember, setGroupsMember] = useState<SandboxMember | null>(null)
  const [bulkRemoveOpen, setBulkRemoveOpen] = useState(false)
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false)

  const q = search.trim().toLowerCase()
  const isFiltered =
    !!q ||
    side !== 'all' ||
    role !== 'all' ||
    group !== 'all' ||
    invitation !== 'all'

  const rows = useMemo(() => {
    const list = members.filter(m => {
      if (side !== 'all' && m.side !== side) return false
      if (
        role !== 'all' &&
        !m.roles.includes(role) &&
        !m.group_kinds.includes(role)
      )
        return false
      if (
        group === 'none'
          ? m.group_ids.length > 0
          : group !== 'all' && !m.group_ids.includes(group)
      )
        return false
      if (invitation !== 'all' && m.invitation_status !== invitation)
        return false
      if (q && !`${m.name ?? ''} ${m.email}`.toLowerCase().includes(q))
        return false
      return true
    })
    return list.sort((a, b) => {
      if (a.side !== b.side) return a.side === 'ours' ? -1 : 1
      return (a.name || a.email).localeCompare(b.name || b.email)
    })
  }, [members, side, role, group, invitation, q])

  const selectedMembers = members.filter(m => selected.has(m.id))
  const selectedWaiting = selectedMembers.filter(
    m => m.side === 'theirs' && isWaiting(m),
  )
  const allVisibleSelected =
    rows.length > 0 && rows.every(m => selected.has(m.id))
  const someVisibleSelected = rows.some(m => selected.has(m.id))

  const toggleAll = (checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev)
      for (const m of rows) {
        if (checked) next.add(m.id)
        else next.delete(m.id)
      }
      return next
    })
  }
  const toggle = (id: string, checked: boolean) =>
    setSelected(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })

  const clearFilters = () => {
    setSearch('')
    setSide('all')
    setRole('all')
    setGroup('all')
    setInvitation('all')
  }

  const ours = members.filter(m => m.side === 'ours').length
  const theirs = members.length - ours
  const hasRowMenu = can.editTeam || can.editGroups || can.invite

  return (
    <section
      id="team"
      className="scroll-mt-20 rounded-xl border border-line bg-paper"
      data-testid="people-table"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Team{' '}
            <span className="ml-1 text-sm font-normal text-ink-3">
              {members.length}
            </span>
          </h2>
          <p className="text-xs text-ink-3" data-testid="people-summary">
            {ours} ours · {theirs} from {sandbox.organisation}
          </p>
        </div>
        {can.editTeam && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={actions.onAddOurs}>
              <Plus className="h-4 w-4" />
              Add from our people
            </Button>
            <Button
              size="sm"
              className="bg-ink text-ink-on-dark hover:bg-ink/90"
              onClick={actions.onAddTheirs}
            >
              <Plus className="h-4 w-4" />
              Add by email
            </Button>
          </div>
        )}
      </header>

      <div className="space-y-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="pl-8"
              aria-label="Search people"
              data-testid="people-search"
            />
          </div>
          <Select value={side} onValueChange={v => setSide(v as SideFilter)}>
            <SelectTrigger className="w-full sm:w-36" aria-label="Side">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Both sides</SelectItem>
              <SelectItem value="ours">Our side</SelectItem>
              <SelectItem value="theirs">Their side</SelectItem>
            </SelectContent>
          </Select>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any role</SelectItem>
              {ROLE_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Group">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any group</SelectItem>
              <SelectItem value="none">No group</SelectItem>
              {groups.map(g => (
                <SelectItem key={g.id} value={g.id}>
                  {g.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={invitation} onValueChange={setInvitation}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Invitation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any invitation</SelectItem>
              {INVITATION_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              className="text-ink-3"
              onClick={clearFilters}
              data-testid="clear-filters"
            >
              Clear
            </Button>
          )}
        </div>

        {selected.size > 0 && (
          <div
            className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
            data-testid="bulk-bar"
          >
            <span className="font-medium text-ink">
              {selected.size} selected
            </span>
            <span className="text-ink-4">·</span>
            {can.invite && (
              <Button
                variant="outline"
                size="sm"
                disabled={
                  selectedWaiting.length === 0 || sendInvitations.isPending
                }
                onClick={() => setBulkInviteOpen(true)}
                data-testid="bulk-invite"
              >
                Send {pluralise(selectedWaiting.length, 'invitation')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setBulkRemoveOpen(true)}
              data-testid="bulk-remove"
            >
              Remove from sandbox
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-ink-3"
              onClick={() => setSelected(new Set())}
            >
              Clear selection
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto border-t border-line">
        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No one matches"
            description="Try a different search or clear the filters."
            action={{ label: 'Clear filters', onClick: clearFilters }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {can.editTeam && (
                  <TableHead className="w-10 pl-5">
                    <Checkbox
                      aria-label="Select everyone shown"
                      checked={
                        allVisibleSelected
                          ? true
                          : someVisibleSelected
                            ? 'indeterminate'
                            : false
                      }
                      onCheckedChange={v => toggleAll(v === true)}
                      data-testid="select-all"
                    />
                  </TableHead>
                )}
                <TableHead className={cn(!can.editTeam && 'pl-5')}>
                  Person
                </TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead>Invitation</TableHead>
                <TableHead>Added</TableHead>
                {hasRowMenu && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(m => {
                const chips = roleChips(m)
                const isSelf = m.user_id === user?.id
                const who = m.name || m.email
                return (
                  <TableRow
                    key={m.id}
                    data-testid="person-row"
                    data-email={m.email}
                    data-state={selected.has(m.id) ? 'selected' : undefined}
                    className={cn(selected.has(m.id) && 'bg-surface-2')}
                  >
                    {can.editTeam && (
                      <TableCell className="pl-5">
                        <Checkbox
                          aria-label={`Select ${who}`}
                          checked={selected.has(m.id)}
                          onCheckedChange={v => toggle(m.id, v === true)}
                        />
                      </TableCell>
                    )}
                    <TableCell className={cn(!can.editTeam && 'pl-5')}>
                      <div className="flex items-center gap-3">
                        <PersonAvatar
                          name={m.name}
                          email={m.email}
                          dashed={m.side === 'theirs' && isWaiting(m)}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {who}
                            {isSelf && (
                              <span className="ml-1.5 text-xs font-normal text-ink-3">
                                (you)
                              </span>
                            )}
                          </p>
                          {m.name && (
                            <p className="truncate text-xs text-ink-3">
                              {m.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-ink-2">
                      {m.side === 'ours' ? 'Novus' : sandbox.organisation}
                    </TableCell>
                    <TableCell>
                      {chips.length ? (
                        <div className="flex flex-wrap gap-1">
                          {chips.map(c => (
                            <span
                              key={c.label}
                              className={cn(
                                'inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs',
                                c.derived
                                  ? 'border border-line text-ink-3'
                                  : 'bg-surface-3 text-ink-2',
                              )}
                            >
                              {c.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-4">No role yet</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-ink-2">
                      {m.memberships.length ? (
                        <span className="line-clamp-2">{groupsText(m)}</span>
                      ) : (
                        <span className="text-ink-4">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {m.side === 'theirs' ? (
                        <InvitationBadge member={m} />
                      ) : (
                        <span
                          className="whitespace-nowrap text-xs text-ink-3"
                          data-testid="notified"
                        >
                          {m.notified_at
                            ? `Emailed ${fmtDay(toDateOnly(new Date(m.notified_at)))}`
                            : 'Not emailed'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-[11px] text-ink-3">
                      {fmtDay(toDateOnly(new Date(m.created_at)), true)}
                    </TableCell>
                    {hasRowMenu && (
                      <TableCell className="pr-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-ink-3"
                              aria-label={`Actions for ${who}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {actions.onChangeRoles && (
                              <DropdownMenuItem
                                onClick={() => actions.onChangeRoles?.(m)}
                              >
                                Change roles
                              </DropdownMenuItem>
                            )}
                            {can.editGroups && (
                              <DropdownMenuItem
                                onClick={() => setGroupsMember(m)}
                              >
                                Change groups
                              </DropdownMenuItem>
                            )}
                            {m.side === 'ours' && can.editTeam && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => resendAdded.mutate(m.id)}
                                  data-testid="resend-added"
                                >
                                  {m.notified_at
                                    ? 'Send the added email again'
                                    : 'Send the added email'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setAddedPreviewId(m.id)}
                                >
                                  Preview email
                                </DropdownMenuItem>
                              </>
                            )}
                            {m.side === 'theirs' && can.invite && (
                              <>
                                <DropdownMenuSeparator />
                                {(m.invitation_status === 'not_sent' ||
                                  m.invitation_status === 'has_account') && (
                                  <DropdownMenuItem
                                    onClick={() => actions.onInvite?.(m)}
                                  >
                                    Send invitation
                                  </DropdownMenuItem>
                                )}
                                {(m.invitation_status === 'sent' ||
                                  m.invitation_status === 'expired') && (
                                  <DropdownMenuItem
                                    onClick={() => actions.onResend?.(m)}
                                  >
                                    Resend invitation
                                  </DropdownMenuItem>
                                )}
                                {m.invitation_status === 'sent' && (
                                  <DropdownMenuItem
                                    onClick={() => actions.onRevoke?.(m)}
                                  >
                                    Revoke invitation
                                  </DropdownMenuItem>
                                )}
                                {m.invitation_status !== 'accepted' && (
                                  <DropdownMenuItem
                                    onClick={() => actions.onPreview?.(m)}
                                  >
                                    Preview email
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {actions.onRemove && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => actions.onRemove?.(m)}
                                >
                                  Remove from sandbox
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <ChangeGroupsDialog
        member={groupsMember}
        onOpenChange={o => !o && setGroupsMember(null)}
        overview={overview}
      />
      <EmailPreviewDialog
        sandboxId={sandboxId}
        memberId={addedPreviewId}
        kind="added"
        onOpenChange={o => !o && setAddedPreviewId(null)}
      />
      <BulkRemoveDialog
        open={bulkRemoveOpen}
        onOpenChange={setBulkRemoveOpen}
        overview={overview}
        members={selectedMembers}
        sessionsByMember={sessionsByMember}
        onRemoved={() => setSelected(new Set())}
      />
      <ConfirmationDialog
        open={bulkInviteOpen}
        onOpenChange={setBulkInviteOpen}
        title={`Send ${selectedWaiting.length === 1 ? 'the invitation' : `${selectedWaiting.length} invitations`}?`}
        description="Each person gets one email with a link that lasts 7 days. People who already have a live invitation are skipped."
        confirmText="Send"
        onConfirm={async () => {
          await sendInvitations.mutateAsync({
            member_ids: selectedWaiting.map(m => m.id),
          })
          setBulkInviteOpen(false)
          setSelected(new Set())
        }}
      />
    </section>
  )
}
