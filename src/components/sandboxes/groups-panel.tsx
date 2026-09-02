'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GroupCard } from '@/components/sandboxes/group-card'
import { pluralise } from '@/lib/sandbox/format'
import type { SandboxGroup, SandboxOverview } from '@/types/sandbox'

export function GroupsPanel({
  overview,
  onNew,
  onEdit,
  onDelete,
}: {
  overview: SandboxOverview
  onNew: () => void
  onEdit: (group: SandboxGroup) => void
  onDelete: (group: SandboxGroup) => void
}) {
  const { groups, checklist } = overview

  return (
    <section
      id="groups"
      className="scroll-mt-6 rounded-xl border border-line bg-paper"
      data-testid="groups-panel"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink">
          Groups{' '}
          <span className="ml-1 text-sm font-normal text-ink-3">
            {groups.length}
            {groups.length > 0 &&
              ` · ${pluralise(checklist.groups.coachee_count, 'coachee')}`}
          </span>
        </h2>
        {groups.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onNew}
            data-testid="new-group"
          >
            <Plus className="h-4 w-4" />
            New group
          </Button>
        )}
      </header>

      <div className="px-5 py-4">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-ink-4 px-6 py-10 text-center">
            <p className="text-sm font-medium text-ink">No groups yet</p>
            <p className="mt-1 max-w-md text-sm text-ink-3">
              A group is a coach, or a few, with the coachees they work with,
              and the hours each coachee gets. Coachees become clients of their
              coaches as soon as the group is saved.
            </p>
            <Button
              className="mt-4 bg-ink text-ink-on-dark hover:bg-ink/90"
              size="sm"
              onClick={onNew}
              data-testid="build-group"
            >
              Build a group
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            <button
              type="button"
              onClick={onNew}
              className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-ink-4 text-sm text-ink-3 transition-colors hover:border-ink hover:text-ink"
              data-testid="add-another-group"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add another group
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
