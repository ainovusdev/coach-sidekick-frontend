'use client'

/**
 * Commitments, inside the sandbox.
 *
 * Two kinds in one list: the team's work items, and what coachees agreed with
 * their coaches. Whoever runs the programme follows the second kind by title,
 * status and date only — those rows are quiet and do not open. A coach sees
 * their own coachees' in full.
 *
 * The page is three rows of chrome and a list: one sentence that says how
 * things stand, one control for how the list is cut, and the rows.
 */

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { CommitmentCreatePanel } from '@/components/commitments/commitment-create-panel'
import {
  CommitmentSectionCard,
  TrackedRow,
} from '@/components/sandboxes/commitments/commitment-sections'
import { useUpdateCommitment } from '@/hooks/mutations/use-commitment-mutations'
import { useSandboxCommitments } from '@/hooks/queries/use-sandboxes'
import {
  NO_FILTERS,
  STATUS_LABEL,
  VIEW_BYS,
  VIEW_BY_LABEL,
  activeFilterCount,
  applyFilters,
  applyScope,
  buildSections,
  countRows,
  type CommitmentFilters,
  type CommitmentSection,
  type StatusFilter,
  type ViewBy,
} from '@/lib/sandbox/commitments-view'
import { pluralise } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { SandboxOverview } from '@/types/sandbox'
import type { SandboxCommitmentRow } from '@/types/sandbox-commitments'

const VIEW_KEY = 'sandbox-commitments-view'

function rememberedView(): ViewBy | null {
  try {
    const v = window.localStorage.getItem(VIEW_KEY)
    return VIEW_BYS.includes(v as ViewBy) ? (v as ViewBy) : null
  } catch {
    return null
  }
}

/** What the create panel starts with, depending on where "add" was pressed. */
interface CreateIntent {
  assignee?: { user_id: string; name: string } | null
  /** A coach adding under their own coachee: a coaching commitment. */
  clientId?: string
  about?: string
}

export function CommitmentsTab({
  overview,
  onOpenCommitment,
}: {
  overview: SandboxOverview
  onOpenCommitment: (id: string) => void
}) {
  const sandboxId = overview.sandbox.id
  const today = overview.today
  const { data, isLoading, isError } = useSandboxCommitments(sandboxId)
  const update = useUpdateCommitment()

  const [by, setBy] = useState<ViewBy | null>(null)
  const [filters, setFilters] = useState<CommitmentFilters>(NO_FILTERS)
  const [creating, setCreating] = useState<CreateIntent | null>(null)

  // Whoever runs the programme thinks in coaches; a coach thinks in coachees.
  useEffect(() => {
    if (by !== null || !data) return
    setBy(rememberedView() ?? (data.tracks_everyone ? 'coach' : 'coachee'))
  }, [by, data])
  const view: ViewBy = by ?? 'coach'
  const chooseView = (next: ViewBy) => {
    setBy(next)
    try {
      window.localStorage.setItem(VIEW_KEY, next)
    } catch {
      // Private window: the choice simply lasts for this visit.
    }
  }

  const rows = useMemo(() => data?.rows ?? [], [data])
  const scoped = useMemo(() => applyScope(rows, filters), [rows, filters])
  const visible = useMemo(
    () => applyFilters(rows, filters, today),
    [rows, filters, today],
  )
  const counts = useMemo(() => countRows(scoped, today), [scoped, today])
  const headline = useMemo(() => countRows(rows, today), [rows, today])
  const sections = useMemo(
    () =>
      data && view !== 'list'
        ? buildSections(
            data,
            visible,
            scoped,
            view,
            today,
            filters.status === 'open' &&
              !filters.q &&
              !filters.mine &&
              activeFilterCount(filters) === 0,
          )
        : [],
    [data, view, visible, scoped, today, filters],
  )

  const setStatus = (status: StatusFilter) =>
    setFilters(f => ({ ...f, status }))
  const isFiltered =
    filters.mine || !!filters.q || activeFilterCount(filters) > 0
  const clear = () => setFilters({ ...NO_FILTERS, status: filters.status })

  const toggleDone = (r: SandboxCommitmentRow) =>
    update.mutate({
      commitmentId: r.id,
      data: { status: r.status === 'completed' ? 'active' : 'completed' },
    })

  const addIn = (s: CommitmentSection) => {
    if (view === 'coach' && s.userId)
      setCreating({ assignee: { user_id: s.userId, name: s.name } })
    else if (view === 'coachee' && s.myClientId)
      setCreating({ clientId: s.myClientId, about: s.name })
    else setCreating({ about: s.memberId ? s.name : undefined })
  }

  const statuses: StatusFilter[] = [
    'open',
    'overdue',
    'done',
    ...(counts.draft > 0 ? (['draft'] as const) : []),
  ]
  const showMoreFilters =
    !!data &&
    data.tracks_everyone &&
    (data.coaches.length > 1 || data.groups.length > 1)

  return (
    <section className="space-y-4" data-testid="commitments-tab">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">Commitments</h2>
          {/* One sentence, not a row of tiles: each number is also the way
              to the rows behind it. */}
          <p
            className="mt-0.5 text-sm text-ink-3"
            data-testid="commitments-summary"
          >
            {rows.length === 0 ? (
              data?.tracks_everyone ? (
                'What the team owes, and what coachees agreed with their coaches.'
              ) : (
                'Your work here, and what your coachees agreed with you.'
              )
            ) : (
              <>
                <SummaryLink onClick={() => setStatus('open')}>
                  {headline.open} open
                </SummaryLink>
                {headline.overdue > 0 && (
                  <>
                    {' · '}
                    <SummaryLink late onClick={() => setStatus('overdue')}>
                      {headline.overdue} overdue
                    </SummaryLink>
                  </>
                )}
                {headline.soon > 0 && ` · ${headline.soon} due this week`}
              </>
            )}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreating({})}
          data-testid="commitments-new"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          New commitment
        </Button>
      </header>

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div
            className="flex w-full rounded-lg border border-line bg-paper p-0.5 sm:w-auto"
            role="tablist"
            aria-label="View by"
          >
            {VIEW_BYS.map(v => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => chooseView(v)}
                data-testid={`commitments-by-${v}`}
                className={cn(
                  'flex-1 rounded-md px-3 py-1 text-xs transition-colors sm:flex-none',
                  view === v
                    ? 'bg-surface-2 font-medium text-ink'
                    : 'text-ink-3 hover:text-ink',
                )}
              >
                {VIEW_BY_LABEL[v]}
              </button>
            ))}
          </div>

          <div
            className="flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="Status"
          >
            {statuses.map(s => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={filters.status === s}
                onClick={() => setStatus(s)}
                data-testid={`commitments-status-${s}`}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  filters.status === s
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-ink-3 hover:border-ink-4 hover:text-ink',
                )}
              >
                {STATUS_LABEL[s]}
                <span className="ml-1 tabular-nums opacity-70">
                  {counts[s]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:flex-1">
            <button
              type="button"
              aria-pressed={filters.mine}
              onClick={() => setFilters(f => ({ ...f, mine: !f.mine }))}
              data-testid="commitments-mine"
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                filters.mine
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line text-ink-3 hover:border-ink-4 hover:text-ink',
              )}
            >
              Mine
            </button>
            <div className="relative order-first min-w-0 flex-1 sm:order-none sm:w-52 sm:flex-none">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
              <Input
                id="commitments-search"
                value={filters.q}
                onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
                placeholder="Search"
                aria-label="Search commitments"
                className="h-8 pl-8 text-sm"
                data-testid="commitments-search"
              />
            </div>
            {showMoreFilters && data && (
              <MoreFilters
                filters={filters}
                onChange={setFilters}
                coaches={data.coaches
                  .filter(c => c.member_id)
                  .map(c => ({ id: c.member_id as string, name: c.name }))}
                groups={data.groups}
              />
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      ) : isError ? (
        <p className="text-sm text-ink-3">Commitments couldn’t be loaded.</p>
      ) : rows.length === 0 ? (
        <Empty>
          No commitments yet. They appear here when a coach and coachee agree
          one in a session, or when you add one.
        </Empty>
      ) : visible.length === 0 && sections.length === 0 ? (
        <Empty>
          {isFiltered ? (
            <>
              Nothing matches.{' '}
              <button
                type="button"
                className="underline underline-offset-4 hover:text-ink"
                onClick={clear}
                data-testid="commitments-clear"
              >
                Clear filters
              </button>
            </>
          ) : filters.status === 'overdue' ? (
            'Nothing overdue.'
          ) : filters.status === 'done' ? (
            'Nothing finished yet.'
          ) : (
            'Nothing open — everything here is done.'
          )}
        </Empty>
      ) : view === 'list' ? (
        <div
          className="overflow-hidden rounded-xl border border-line bg-paper"
          data-testid="commitments-list"
        >
          {visible.map(r => (
            <TrackedRow
              key={r.id}
              row={r}
              by="list"
              today={today}
              onOpen={onOpenCommitment}
              onToggle={toggleDone}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map(s => (
            <CommitmentSectionCard
              key={`${view}:${s.key}`}
              section={s}
              by={view}
              today={today}
              sandboxId={sandboxId}
              // Few sections: nothing to hide. Many: open where it hurts.
              defaultOpen={sections.length <= 3 || s.overdue > 0}
              forceOpen={isFiltered || filters.status !== 'open'}
              onOpen={onOpenCommitment}
              onToggle={toggleDone}
              onAdd={() => addIn(s)}
            />
          ))}
        </div>
      )}

      <CommitmentCreatePanel
        isOpen={creating !== null}
        onClose={() => setCreating(null)}
        clientId={creating?.clientId}
        context={
          creating?.clientId
            ? undefined
            : { sandboxId, sandboxName: overview.sandbox.name }
        }
        defaultAssignee={
          creating?.assignee
            ? {
                user_id: creating.assignee.user_id,
                name: creating.assignee.name,
                email: null,
              }
            : null
        }
      />
    </section>
  )
}

function SummaryLink({
  children,
  onClick,
  late,
}: {
  children: React.ReactNode
  onClick: () => void
  late?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'tabular-nums underline-offset-4 hover:underline',
        late ? 'font-medium text-vermillion' : 'text-ink-2',
      )}
    >
      {children}
    </button>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="rounded-xl border border-dashed border-line px-5 py-8 text-center text-sm text-ink-3"
      data-testid="commitments-empty"
    >
      {children}
    </p>
  )
}

/** The filters most visits never need, behind one button. */
function MoreFilters({
  filters,
  onChange,
  coaches,
  groups,
}: {
  filters: CommitmentFilters
  onChange: (next: CommitmentFilters) => void
  coaches: { id: string; name: string }[]
  groups: { id: string; name: string }[]
}) {
  const active = activeFilterCount(filters)
  const select =
    'h-8 w-full rounded-md border border-line bg-paper px-2 text-sm text-ink'
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          data-testid="commitments-filter"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter
          {active > 0 && (
            <span className="rounded-full bg-ink px-1.5 text-[10px] tabular-nums text-paper">
              {active}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-3">
        <label className="block space-y-1 text-xs text-ink-3">
          Coach
          <select
            id="commitments-filter-coach"
            className={select}
            value={filters.coachId ?? ''}
            onChange={e =>
              onChange({ ...filters, coachId: e.target.value || null })
            }
          >
            <option value="">Every coach</option>
            {coaches.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs text-ink-3">
          Group
          <select
            id="commitments-filter-group"
            className={select}
            value={filters.groupId ?? ''}
            onChange={e =>
              onChange({ ...filters, groupId: e.target.value || null })
            }
          >
            <option value="">Every group</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs text-ink-3">
          Kind
          <select
            id="commitments-filter-kind"
            className={select}
            value={filters.kind ?? ''}
            onChange={e =>
              onChange({
                ...filters,
                kind: (e.target.value || null) as CommitmentFilters['kind'],
              })
            }
          >
            <option value="">Everything</option>
            <option value="coaching">Agreed in coaching</option>
            <option value="team">Team work</option>
          </select>
        </label>
        {active > 0 && (
          <button
            type="button"
            className="text-xs text-ink-3 underline underline-offset-4 hover:text-ink"
            onClick={() =>
              onChange({ ...filters, coachId: null, groupId: null, kind: null })
            }
          >
            Clear {pluralise(active, 'filter')}
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
