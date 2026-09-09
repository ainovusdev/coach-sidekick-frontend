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
  SelectGroup,
  SelectItem,
  SelectLabel,
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

type SideKey = 'ours' | 'theirs'

const ROLE_OPTIONS: {
  value: string
  label: string
  side: SideKey
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
 * Column widths shared by both tables, so the two lists line up under one
 * another. `table-fixed` makes them binding rather than a hint, which every
 * cell already expects — the name truncates, the groups clamp, the chips wrap.
 */
function columnWidths(withCheckbox: boolean, withMenu: boolean): string[] {
  const spare = (withCheckbox ? 0 : 4) + (withMenu ? 0 : 4)
  return [
    ...(withCheckbox ? ['4%'] : []),
    `${27 + spare}%`,
    '21%',
    '18%',
    '15%',
    '11%',
    ...(withMenu ? ['4%'] : []),
  ]
}

/**
 * Everyone on the sandbox, as the Team tab shows them to whoever runs it.
 *
 * One list per side rather than one list with a Side column: the two sides are
 * managed differently — ours get an added email, theirs get an invitation — and
 * the column that said which was which is what the two cards now say once. The
 * search and the filters sit above both; the dialogs the cockpit already owns
 * arrive as `actions`, and only the ones it has no use for elsewhere (groups,
 * bulk removal, bulk invitations) live here.
 */
export function PeopleTable({
  overview,
  actions,
}: {
  overview: SandboxOverview
  actions: PeopleTableActions
}) {
  const { user } = useAuth()
  const { sandbox, members, groups } = overview
  const sandboxId = sandbox.id
  const sendInvitations = useSendInvitations(sandboxId)

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
  const [role, setRole] = useState('all')
  const [group, setGroup] = useState('all')
  const [invitation, setInvitation] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [groupsMember, setGroupsMember] = useState<SandboxMember | null>(null)
  const [addedPreviewId, setAddedPreviewId] = useState<string | null>(null)
  const [bulkRemoveSide, setBulkRemoveSide] = useState<SideKey | null>(null)
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false)

  const q = search.trim().toLowerCase()
  const isFiltered =
    !!q || role !== 'all' || group !== 'all' || invitation !== 'all'

  const rows = useMemo(() => {
    const list = members.filter(m => {
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
    return list.sort((a, b) =>
      (a.name || a.email).localeCompare(b.name || b.email),
    )
  }, [members, role, group, invitation, q])

  const selectedMembers = members.filter(m => selected.has(m.id))
  const selectedWaiting = selectedMembers.filter(
    m => m.side === 'theirs' && isWaiting(m),
  )

  const toggle = (id: string, checked: boolean) =>
    setSelected(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })

  const toggleMany = (ids: string[], checked: boolean) =>
    setSelected(prev => {
      const next = new Set(prev)
      for (const id of ids) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })

  const clearSide = (side: SideKey) =>
    setSelected(prev => {
      const next = new Set(prev)
      for (const m of members) if (m.side === side) next.delete(m.id)
      return next
    })

  const clearFilters = () => {
    setSearch('')
    setRole('all')
    setGroup('all')
    setInvitation('all')
  }

  const ours = members.filter(m => m.side === 'ours')
  const theirs = members.filter(m => m.side === 'theirs')

  const sideProps = (side: SideKey) => ({
    side,
    organisation: sandbox.organisation,
    sandboxId,
    rows: rows.filter(m => m.side === side),
    total: (side === 'ours' ? ours : theirs).length,
    isFiltered,
    selfId: user?.id,
    selected,
    selectedOnSide: selectedMembers.filter(m => m.side === side),
    onToggle: toggle,
    onToggleMany: toggleMany,
    onClearSelection: () => clearSide(side),
    onAdd: side === 'ours' ? actions.onAddOurs : actions.onAddTheirs,
    actions,
    onChangeGroups: setGroupsMember,
    onPreviewAdded: (m: SandboxMember) => setAddedPreviewId(m.id),
    onBulkRemove: () => setBulkRemoveSide(side),
    onBulkInvite: () => setBulkInviteOpen(true),
    invitePending: sendInvitations.isPending,
  })

  return (
    <section
      id="team"
      className="scroll-mt-20 space-y-4"
      data-testid="people-table"
    >
      <div>
        <h2 className="text-base font-semibold text-ink">
          Team{' '}
          <span className="ml-1 text-sm font-normal text-ink-3">
            {members.length}
          </span>
        </h2>
        <p className="text-xs text-ink-3" data-testid="people-summary">
          {ours.length} ours · {theirs.length} from {sandbox.organisation}
        </p>
      </div>

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
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any role</SelectItem>
            <SelectGroup>
              <SelectLabel>Our side</SelectLabel>
              {ROLE_OPTIONS.filter(o => o.side === 'ours').map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Their side</SelectLabel>
              {ROLE_OPTIONS.filter(o => o.side === 'theirs').map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectGroup>
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

      {isFiltered && rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-paper">
          <EmptyState
            icon={Users}
            title="No one matches"
            description="Try a different search or clear the filters."
            action={{ label: 'Clear filters', onClick: clearFilters }}
          />
        </div>
      ) : (
        <>
          <SideCard {...sideProps('ours')} />
          <SideCard {...sideProps('theirs')} />
        </>
      )}

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
        open={bulkRemoveSide !== null}
        onOpenChange={o => !o && setBulkRemoveSide(null)}
        overview={overview}
        members={selectedMembers.filter(m => m.side === bulkRemoveSide)}
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

/**
 * One side's list. Same table both times — what differs is who the fifth
 * column is about (an added email for us, an invitation for them) and which
 * "add" button belongs at the top of it.
 */
function SideCard({
  side,
  organisation,
  sandboxId,
  rows,
  total,
  isFiltered,
  selfId,
  selected,
  selectedOnSide,
  onToggle,
  onToggleMany,
  onClearSelection,
  onAdd,
  actions,
  onChangeGroups,
  onPreviewAdded,
  onBulkRemove,
  onBulkInvite,
  invitePending,
}: {
  side: SideKey
  organisation: string
  sandboxId: string
  rows: SandboxMember[]
  total: number
  isFiltered: boolean
  selfId?: string
  selected: Set<string>
  selectedOnSide: SandboxMember[]
  onToggle: (id: string, checked: boolean) => void
  onToggleMany: (ids: string[], checked: boolean) => void
  onClearSelection: () => void
  onAdd: () => void
  actions: PeopleTableActions
  onChangeGroups: (member: SandboxMember) => void
  onPreviewAdded: (member: SandboxMember) => void
  onBulkRemove: () => void
  onBulkInvite: () => void
  invitePending: boolean
}) {
  const { can } = useSandboxView()
  const resendAdded = useResendAddedEmail(sandboxId)

  const ours = side === 'ours'
  const who = ours ? 'our side' : organisation
  const hasRowMenu = can.editTeam || can.editGroups || can.invite
  const widths = columnWidths(can.editTeam, hasRowMenu)

  const waiting = selectedOnSide.filter(isWaiting)
  const allVisibleSelected =
    rows.length > 0 && rows.every(m => selected.has(m.id))
  const someVisibleSelected = rows.some(m => selected.has(m.id))
  const shown =
    isFiltered && rows.length !== total
      ? `${rows.length} of ${total}`
      : `${total}`

  return (
    <section
      className="rounded-xl border border-line bg-paper"
      data-testid={ours ? 'our-side' : 'their-side'}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          {ours ? 'Our side' : 'Their side'}{' '}
          <span className="text-ink-4">· {ours ? 'Novus' : organisation}</span>
          <span className="ml-2 rounded-full bg-surface-3 px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal text-ink-2">
            {shown}
          </span>
        </h3>
        {can.editTeam && (
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            {ours ? 'Add from our people' : 'Add by email'}
          </Button>
        )}
      </header>

      {selectedOnSide.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2 px-5 py-2 text-sm"
          data-testid="bulk-bar"
          data-side={side}
        >
          <span className="font-medium text-ink">
            {selectedOnSide.length} selected
          </span>
          <span className="text-ink-4">·</span>
          {!ours && can.invite && (
            <Button
              variant="outline"
              size="sm"
              disabled={waiting.length === 0 || invitePending}
              onClick={onBulkInvite}
              data-testid="bulk-invite"
            >
              Send {pluralise(waiting.length, 'invitation')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onBulkRemove}
            data-testid="bulk-remove"
          >
            Remove from sandbox
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-ink-3"
            onClick={onClearSelection}
          >
            Clear selection
          </Button>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-ink-3">
          {isFiltered
            ? `No one from ${who} matches.`
            : `No one from ${who} yet.`}
        </p>
      ) : (
        <Table className="min-w-[680px] table-fixed">
          <colgroup>
            {widths.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {can.editTeam && (
                <TableHead className="pl-5">
                  <Checkbox
                    aria-label={
                      ours
                        ? 'Select everyone shown on our side'
                        : `Select everyone shown from ${organisation}`
                    }
                    checked={
                      allVisibleSelected
                        ? true
                        : someVisibleSelected
                          ? 'indeterminate'
                          : false
                    }
                    onCheckedChange={v =>
                      onToggleMany(
                        rows.map(m => m.id),
                        v === true,
                      )
                    }
                  />
                </TableHead>
              )}
              <TableHead className={cn(!can.editTeam && 'pl-5')}>
                Person
              </TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>{ours ? 'Notified' : 'Invitation'}</TableHead>
              <TableHead>Added</TableHead>
              {hasRowMenu && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(m => {
              const chips = roleChips(m)
              const isSelf = m.user_id === selfId
              const name = m.name || m.email
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
                        aria-label={`Select ${name}`}
                        checked={selected.has(m.id)}
                        onCheckedChange={v => onToggle(m.id, v === true)}
                      />
                    </TableCell>
                  )}
                  <TableCell className={cn(!can.editTeam && 'pl-5')}>
                    <div className="flex items-center gap-3">
                      <PersonAvatar
                        name={m.name}
                        email={m.email}
                        dashed={!ours && isWaiting(m)}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {name}
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
                  <TableCell className="text-sm text-ink-2">
                    {m.memberships.length ? (
                      <span className="line-clamp-2">{groupsText(m)}</span>
                    ) : (
                      <span className="text-ink-4">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {ours ? (
                      <span
                        className="whitespace-nowrap text-xs text-ink-3"
                        data-testid="notified"
                      >
                        {m.notified_at
                          ? `Emailed ${fmtDay(toDateOnly(new Date(m.notified_at)))}`
                          : 'Not emailed'}
                      </span>
                    ) : (
                      <InvitationBadge member={m} />
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
                            aria-label={`Actions for ${name}`}
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
                            <DropdownMenuItem onClick={() => onChangeGroups(m)}>
                              Change groups
                            </DropdownMenuItem>
                          )}
                          {ours && can.editTeam && (
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
                                onClick={() => onPreviewAdded(m)}
                              >
                                Preview email
                              </DropdownMenuItem>
                            </>
                          )}
                          {!ours && can.invite && (
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
    </section>
  )
}
