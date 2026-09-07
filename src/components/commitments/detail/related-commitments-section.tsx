'use client'

/**
 * Related commitments — the symmetric siblings of a commitment.
 *
 * Relate 2, 3 and 4 to 1 and they are listed here under 1 while 1 is listed
 * under each of them. The API fills `related` with the rows the viewer may
 * see and `related_total` / `related_done` with the whole picture, so the
 * header count can be larger than the list for someone who reaches only
 * their own row.
 *
 * Three ways in: tick a row (status completed ↔ active), quick-add a new
 * commitment in the same context (client / sandbox / visibility) for a
 * person, or relate an existing open commitment from the same context.
 * "Unrelate" needs no confirm — it is one click to put back.
 *
 * Coach and portal share this component: `clientMode` swaps the mutation
 * hooks for their portal twins, the way the rest of the panel does.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Link2, Plus, Search, Unlink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { AssigneeChip } from '@/components/people/assignee-chip'
import {
  PersonPicker,
  type PickedPerson,
} from '@/components/people/person-picker'
import { useAuth } from '@/contexts/auth-context'
import {
  useCreateCommitment,
  useRelateCommitment,
  useUnrelateCommitment,
  useUpdateCommitment,
} from '@/hooks/mutations/use-commitment-mutations'
import {
  useClientRelateCommitment,
  useClientUnrelateCommitment,
  useClientUpdateCommitment,
} from '@/hooks/mutations/use-client-commitment-mutations'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useConfetti } from '@/hooks/use-confetti'
import { assigneeOf } from '@/lib/commitments/assignee'
import { formatDateOnly } from '@/lib/date-utils'
import { queryKeys } from '@/lib/query-client'
import { cn } from '@/lib/utils'
import type { Commitment, CommitmentStatus } from '@/types/commitment'
import { daysUntilDue, isOverdue } from '../hub/commitment-view'

const MAX_CANDIDATES = 8

function isClosed(c: Pick<Commitment, 'status'>): boolean {
  return c.status === 'completed' || c.status === 'abandoned'
}

export function RelatedCommitmentsSection({
  commitment,
  commitmentId,
  clientMode,
  onNavigate,
  className,
}: {
  commitment: Commitment
  commitmentId: string
  clientMode?: boolean
  /** Open another commitment where this one is shown (panel swap or page push). */
  onNavigate?: (id: string) => void
  className?: string
}) {
  const rows = useMemo(() => commitment.related ?? [], [commitment.related])
  const total = commitment.related_total ?? rows.length
  const done =
    commitment.related_done ?? rows.filter(r => r.status === 'completed').length
  const canEdit = commitment.can_edit !== false
  const sandboxId = commitment.sandbox_id ?? null

  const queryClient = useQueryClient()
  const { fireConfetti } = useConfetti()
  const { userId, user } = useAuth()

  // Both variants are called unconditionally and then picked between —
  // never make these conditional, it would break hook order.
  const coachUpdate = useUpdateCommitment({ silent: true })
  const clientUpdate = useClientUpdateCommitment({ silent: true })
  const update = clientMode ? clientUpdate : coachUpdate
  const coachRelate = useRelateCommitment()
  const clientRelate = useClientRelateCommitment()
  const relate = clientMode ? clientRelate : coachRelate
  const coachUnrelate = useUnrelateCommitment()
  const clientUnrelate = useClientUnrelateCommitment()
  const unrelate = clientMode ? clientUnrelate : coachUnrelate
  const create = useCreateCommitment()

  // --- tick a related row -------------------------------------------------
  const toggle = (row: Commitment) => {
    if (row.can_edit === false || row.id.startsWith('temp-')) return
    const next: CommitmentStatus =
      row.status === 'completed' ? 'active' : 'completed'
    // The parent's cached list shows the tick at once; the update mutation
    // invalidates the whole prefix afterwards so counts everywhere agree.
    queryClient.setQueryData(
      queryKeys.commitments.detail(commitmentId),
      (old: any) =>
        old
          ? {
              ...old,
              related: (old.related ?? []).map((r: Commitment) =>
                r.id === row.id ? { ...r, status: next } : r,
              ),
              related_done: Math.max(
                0,
                (old.related_done ?? 0) + (next === 'completed' ? 1 : -1),
              ),
            }
          : old,
    )
    update.mutate({ commitmentId: row.id, data: { status: next } })
    if (next === 'completed') fireConfetti({ intensity: 'subtle' })
  }

  // --- quick add ----------------------------------------------------------
  // A new row copies this one's context: same client or sandbox, same
  // visibility (private only if it has a person to be private for). The
  // person defaults to the client on a client's commitment and to you on
  // anything else — the way the create panel does it.
  const clientOption = useMemo(
    () =>
      !clientMode && commitment.client_id
        ? {
            client_id: commitment.client_id,
            name: commitment.client_name ?? null,
            user_id: commitment.assignee?.client_id
              ? commitment.assignee.user_id
              : undefined,
          }
        : null,
    [
      clientMode,
      commitment.client_id,
      commitment.client_name,
      commitment.assignee,
    ],
  )
  const defaultPick = useMemo<PickedPerson | null>(() => {
    // In the portal "you" is the coachee's own login, which the API treats
    // as the client themself; on a coach's client row it is the client.
    if (!clientMode && commitment.client_id)
      return {
        user_id: null,
        client_id: commitment.client_id,
        name: commitment.client_name ?? null,
        email: null,
      }
    if (userId)
      return {
        user_id: userId,
        name: user?.full_name ?? null,
        email: user?.email ?? null,
        has_account: true,
      }
    return null
  }, [clientMode, commitment.client_id, commitment.client_name, userId, user])
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState<PickedPerson | null>(defaultPick)
  useEffect(() => setAssignee(defaultPick), [defaultPick, commitmentId])

  const submitQuickAdd = () => {
    const t = title.trim()
    if (!t || create.isPending) return
    const assignedToId = assignee?.user_id ?? null
    create.mutate({
      title: t,
      type: 'commitment',
      priority: 'medium',
      client_id: commitment.client_id ?? undefined,
      sandbox_id: commitment.sandbox_id ?? undefined,
      visibility:
        commitment.visibility === 'private' && assignedToId
          ? 'private'
          : 'shared',
      assigned_to_id: assignedToId,
      related_ids: [commitmentId],
    })
    setTitle('')
  }

  // --- relate an existing one --------------------------------------------
  const [linkOpen, setLinkOpen] = useState(false)
  const [query, setQuery] = useState('')
  // The same filter shape the cockpit panel and the client page already use,
  // so opening the popover is usually a cache hit.
  const filters = useMemo(
    () =>
      commitment.sandbox_id
        ? { sandbox_id: commitment.sandbox_id, include_drafts: true }
        : commitment.client_id
          ? { client_id: commitment.client_id, include_drafts: true }
          : undefined,
    [commitment.sandbox_id, commitment.client_id],
  )
  const { data: candidatesData, isLoading: candidatesLoading } = useCommitments(
    filters,
    { enabled: linkOpen && !!filters },
  )
  const relatedIds = useMemo(() => new Set(rows.map(r => r.id)), [rows])
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (candidatesData?.commitments ?? [])
      .filter(
        c =>
          c.id !== commitmentId &&
          !relatedIds.has(c.id) &&
          !isClosed(c) &&
          !c.timeline_event_id &&
          (!q || c.title.toLowerCase().includes(q)),
      )
      .slice(0, MAX_CANDIDATES)
  }, [candidatesData, commitmentId, relatedIds, query])

  const pick = (row: Commitment) => {
    relate.mutate({ commitmentId, relatedId: row.id, related: row, sandboxId })
    setLinkOpen(false)
    setQuery('')
  }

  const titleNode = (row: Commitment) => {
    const label = <span className="truncate">{row.title}</span>
    const cls = cn(
      'min-w-0 flex-1 text-left text-sm',
      row.status === 'completed' ? 'text-ink-3 line-through' : 'text-ink',
      (onNavigate || !clientMode) && 'hover:underline',
    )
    if (onNavigate)
      return (
        <button
          type="button"
          className={cls}
          onClick={() => onNavigate(row.id)}
          data-testid="related-title"
        >
          {label}
        </button>
      )
    if (!clientMode)
      return (
        <Link
          href={`/commitments/${row.id}`}
          className={cls}
          data-testid="related-title"
        >
          {label}
        </Link>
      )
    return (
      <span className={cls} data-testid="related-title">
        {label}
      </span>
    )
  }

  return (
    <div
      className={cn('space-y-3', className)}
      data-testid="related-commitments"
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ink-2">
          Related commitments
        </label>
        {total > 0 && (
          <span className="text-xs text-ink-3" data-testid="related-count">
            {done}/{total}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-ink-3" data-testid="related-empty">
          Nothing related yet.
        </p>
      ) : (
        <div className="space-y-0.5">
          {rows.map(row => (
            <RelatedRow
              key={row.id}
              row={row}
              canUnlink={canEdit || row.can_edit !== false}
              onToggle={() => toggle(row)}
              onUnlink={() =>
                unrelate.mutate({
                  commitmentId,
                  relatedId: row.id,
                  sandboxId,
                })
              }
              title={titleNode(row)}
            />
          ))}
        </div>
      )}

      {canEdit && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 shrink-0 text-ink-4" />
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Add a related commitment…"
              className="h-8 flex-1 border-none px-0 text-sm shadow-none focus-visible:ring-0"
              data-testid="related-add-input"
              onKeyDown={e => {
                if (e.key === 'Enter') submitQuickAdd()
              }}
            />
            <PersonPicker
              value={assignee}
              onChange={setAssignee}
              context={{
                clientId: commitment.client_id ?? null,
                sandboxId: commitment.sandbox_id ?? null,
              }}
              clientOption={clientOption}
              size="sm"
              allowClear={!!commitment.client_id}
              placeholder="Assign"
              contentClassName="z-[90]"
              data-testid="related-add-assignee"
            />
          </div>

          {filters && (
            <Popover
              open={linkOpen}
              onOpenChange={o => {
                setLinkOpen(o)
                if (!o) setQuery('')
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs text-ink-3 hover:text-ink"
                  data-testid="related-link-existing"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Relate an existing commitment
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="z-[90] w-80 p-2"
                data-testid="related-link-popover"
              >
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
                  <Input
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Find an open commitment…"
                    className="h-8 pl-7 text-sm"
                    data-testid="related-link-search"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && candidates[0])
                        pick(candidates[0])
                    }}
                  />
                </div>
                {candidatesLoading ? (
                  <p className="px-2 py-1.5 text-xs text-ink-3">Loading…</p>
                ) : candidates.length === 0 ? (
                  <p className="px-2 py-1.5 text-xs text-ink-3">
                    {query
                      ? 'No open commitment matches.'
                      : 'No other open commitment here.'}
                  </p>
                ) : (
                  <ul className="max-h-64 space-y-0.5 overflow-y-auto">
                    {candidates.map(c => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-ink hover:bg-surface-3"
                          onClick={() => pick(c)}
                          data-testid="related-link-option"
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {c.title}
                          </span>
                          <AssigneeChip
                            assignee={assigneeOf(c)}
                            size="xs"
                            showName={false}
                            className="shrink-0"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </div>
  )
}

function DueChip({ row }: { row: Commitment }) {
  if (!row.target_date || isClosed(row)) return null
  const overdue = isOverdue(row)
  const days = daysUntilDue(row)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 text-[11px]',
        overdue
          ? 'font-medium text-vermillion'
          : days !== null && days <= 7
            ? 'text-amber-token'
            : 'text-ink-3',
      )}
      data-testid="related-due"
    >
      <CalendarDays className="h-3 w-3" aria-hidden />
      {formatDateOnly(row.target_date, 'MMM d')}
    </span>
  )
}

function RelatedRow({
  row,
  title,
  canUnlink,
  onToggle,
  onUnlink,
}: {
  row: Commitment
  title: React.ReactNode
  canUnlink: boolean
  onToggle: () => void
  onUnlink: () => void
}) {
  const readOnly = row.can_edit === false || row.id.startsWith('temp-')
  return (
    <div
      className="group -mx-2 flex items-center gap-2 rounded px-2 py-1.5 hover:bg-surface-3"
      data-testid="related-row"
      data-id={row.id}
      data-status={row.status}
    >
      <Checkbox
        checked={row.status === 'completed'}
        disabled={readOnly}
        onCheckedChange={onToggle}
        className="h-4 w-4"
        aria-label={row.status === 'completed' ? 'Reopen' : 'Mark as completed'}
        data-testid="related-toggle"
      />
      {title}
      {row.timeline_event && (
        <span
          className="shrink-0 rounded-full border border-line px-1.5 text-[10px] font-medium uppercase tracking-wider text-ink-3"
          data-testid="related-event-tag"
        >
          Event
        </span>
      )}
      <AssigneeChip
        assignee={assigneeOf(row)}
        size="xs"
        showName={false}
        className="shrink-0"
      />
      <DueChip row={row} />
      {canUnlink && (
        <button
          type="button"
          className="shrink-0 rounded p-0.5 text-ink-4 opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
          onClick={onUnlink}
          title="Unrelate"
          aria-label="Unrelate"
          data-testid="related-unlink"
        >
          <Unlink className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
