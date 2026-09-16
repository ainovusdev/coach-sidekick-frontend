'use client'

import { useState } from 'react'
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import { fmtHoursShort } from '@/lib/sandbox/delivery'
import { cn } from '@/lib/utils'
import { PersonCard } from './person-card'
import { Empty } from './section'
import type { ClientGroup, ClientPerson } from './client-view-model'

type FilterKey = 'all' | 'behind' | 'on_track' | 'not_started' | 'seal'

const GOOD = ['on_track', 'ahead', 'complete']

const FILTERS: {
  key: FilterKey
  label: string
  match: (p: ClientPerson) => boolean
}[] = [
  { key: 'all', label: 'Everyone', match: () => true },
  { key: 'behind', label: 'Behind', match: p => p.pace.state === 'behind' },
  {
    key: 'on_track',
    label: 'On track',
    match: p => GOOD.includes(p.pace.state),
  },
  {
    key: 'not_started',
    label: 'Not started',
    match: p => p.pace.state === 'not_started',
  },
  {
    key: 'seal',
    label: 'Waiting for a seal',
    match: p => !!p.outcomes?.outcomes.some(o => o.status === 'proposed'),
  },
]

/**
 * Everyone being coached, as cards under their group. The filters are the
 * questions a sponsor actually asks — who is behind, who hasn't started, who
 * is waiting on me — so they are one click rather than a sort on a table.
 */
export function PeopleRoster({
  people,
  groups,
  sandboxId,
}: {
  people: ClientPerson[]
  groups: ClientGroup[]
  sandboxId: string
}) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [group, setGroup] = useState<string>('all')

  if (!people.length)
    return (
      <Empty>No coachees yet. They appear here once groups are set up.</Empty>
    )

  const match = FILTERS.find(f => f.key === filter)?.match ?? (() => true)
  const shownGroups = groups.filter(g => group === 'all' || g.groupId === group)
  const blocks = shownGroups
    .map(g => ({
      group: g,
      people: people.filter(p => p.groupId === g.groupId && match(p)),
    }))
    .filter(b => b.people.length > 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map(f => {
          const count = people.filter(f.match).length
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              data-testid={`people-filter-${f.key}`}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                filter === f.key
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line text-ink-3 hover:border-ink-4 hover:text-ink',
              )}
            >
              {f.label}
              <span className="ml-1 tabular-nums opacity-70">{count}</span>
            </button>
          )
        })}
        {groups.length > 1 && (
          <select
            className="ml-auto rounded-lg border border-line bg-paper px-2.5 py-1 text-xs text-ink focus-visible:outline-2 focus-visible:outline-ds-accent"
            aria-label="Group"
            value={group}
            onChange={e => setGroup(e.target.value)}
            data-testid="people-group"
          >
            <option value="all">All groups</option>
            {groups.map(g => (
              <option key={g.groupId} value={g.groupId}>
                {g.displayName}
              </option>
            ))}
          </select>
        )}
      </div>

      {blocks.length === 0 ? (
        <Empty>No one matches this filter.</Empty>
      ) : (
        blocks.map(({ group: g, people: rows }) => (
          <div key={g.groupId} className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line pb-2">
              <h3 className="text-sm font-semibold text-ink">
                {g.displayName}
              </h3>
              <span className="text-xs text-ink-3">
                {g.coachNames.join(', ') || 'No coach yet'}
              </span>
              <PaceChip state={g.state} />
              <div className="ml-auto flex items-center gap-2">
                <ProgressRail
                  className="w-24"
                  value={g.hoursReceived}
                  max={g.hoursPromised ?? g.hoursReceived}
                />
                <span className="text-xs tabular-nums text-ink-3">
                  {fmtHoursShort(g.hoursReceived)}
                  {g.hoursPromised != null &&
                    ` of ${fmtHoursShort(g.hoursPromised)}`}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {rows.map(p => (
                <PersonCard
                  key={p.member_id}
                  person={p}
                  sandboxId={sandboxId}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
