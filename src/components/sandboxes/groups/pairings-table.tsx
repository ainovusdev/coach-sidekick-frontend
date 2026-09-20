'use client'

import Link from 'next/link'
import { MoreHorizontal, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'
import { fmtContract, fmtDay } from '@/lib/sandbox/format'
import type { SandboxGroup, SandboxGroupMember } from '@/types/sandbox'

function Person({ person }: { person: SandboxGroupMember | undefined }) {
  if (!person) return <span className="text-sm text-amber-token">Not set</span>
  return (
    <span className="flex min-w-0 items-center gap-2">
      <PersonAvatar name={person.name} email={person.email} size="xs" />
      <span className="truncate text-sm text-ink">
        {person.name || person.email}
      </span>
    </span>
  )
}

/**
 * 1:1 pairings — one coach with one coachee, a row each.
 *
 * A sandbox can hold dozens of these, so they are a table rather than cards:
 * the question here is "who works with whom", answered at a glance.
 */
export function PairingsTable({
  pairings,
  createBlocked = false,
  onAdd,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  pairings: SandboxGroup[]
  /** No coach or no coachee on People yet: there is no one to pick from. */
  createBlocked?: boolean
  onAdd: () => void
  onEdit: (group: SandboxGroup) => void
  onDuplicate: (group: SandboxGroup) => void
  onDelete: (group: SandboxGroup) => void
}) {
  const view = useSandboxView()
  const canEdit = view.can.editGroups

  return (
    <section
      id="groups"
      className="scroll-mt-(--section-offset) rounded-xl border border-line bg-paper"
      data-testid="pairings-panel"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5">
        <h2 className="text-base font-semibold text-ink">
          1:1 pairings{' '}
          <span className="ml-1 text-sm font-normal text-ink-3">
            {pairings.length}
          </span>
        </h2>
        {canEdit && pairings.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAdd}
            disabled={createBlocked}
            data-testid="add-pairings"
          >
            <Plus className="h-4 w-4" />
            Add pairings
          </Button>
        )}
      </header>

      {pairings.length === 0 ? (
        <div className="px-5 py-4">
          {canEdit ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-ink-4 px-6 py-8 text-center">
              <p className="text-sm font-medium text-ink">No pairings yet</p>
              <p className="mt-1 max-w-md text-sm text-ink-3">
                A pairing is one coach with one coachee. Add as many as you like
                in one go, all on the same contract.
              </p>
              <Button
                className="mt-4 bg-ink text-ink-on-dark hover:bg-ink/90"
                size="sm"
                onClick={onAdd}
                disabled={createBlocked}
                data-testid="add-pairings"
              >
                Add pairings
              </Button>
            </div>
          ) : (
            <p className="text-sm text-ink-3" data-testid="pairings-empty">
              {view.can.seeAllGroups
                ? 'No pairings yet.'
                : 'You’re not in a pairing yet.'}
            </p>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-line" data-testid="pairings-table">
          {pairings.map(g => (
            <li
              key={g.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-5 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]"
              data-testid="pairing"
              data-complete={g.is_complete}
            >
              <div className="col-span-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 md:contents">
                <Person person={g.coaches[0]} />
                <span className="text-ink-3 md:hidden" aria-hidden>
                  →
                </span>
                <Person person={g.coachees[0]} />
              </div>
              <div className="col-start-1 row-start-2 min-w-0 md:col-start-3 md:row-start-1">
                <Link
                  href={sandboxEntityHref(g.sandbox_id, 'group', g.id)}
                  className="block truncate font-mono text-xs text-ink-2 hover:text-ds-accent hover:underline"
                >
                  {fmtContract(g)}
                </Link>
                <p className="truncate text-xs text-ink-3">
                  {g.is_complete ? (
                    <>
                      {g.cadence_text ? `${g.cadence_text} · ` : ''}
                      from {fmtDay(g.starts_on)}
                    </>
                  ) : (
                    <span className="text-amber-token">
                      Incomplete — won’t count until it’s finished
                    </span>
                  )}
                </p>
              </div>
              {canEdit ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="col-start-2 row-span-2 row-start-1 h-8 w-8 text-ink-3 md:col-start-4 md:row-span-1"
                      aria-label={`Actions for ${g.display_name}`}
                      data-testid="pairing-actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => onEdit(g)}>
                      {g.is_complete ? 'Edit pairing' : 'Finish this pairing'}
                    </DropdownMenuItem>
                    {!createBlocked && (
                      <DropdownMenuItem
                        onClick={() => onDuplicate(g)}
                        data-testid="duplicate-pairing"
                      >
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-vermillion focus:text-vermillion"
                      onClick={() => onDelete(g)}
                    >
                      Remove pairing
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
