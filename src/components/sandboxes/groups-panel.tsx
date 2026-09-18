'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GroupCard } from '@/components/sandboxes/group-card'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
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
  const view = useSandboxView()
  const canEdit = view.can.editGroups
  const coacheeCount =
    checklist?.groups.coachee_count ??
    new Set(groups.flatMap(g => g.coachees.map(c => c.member_id))).size

  return (
    <section
      id="groups"
      className="scroll-mt-(--section-offset) rounded-xl border border-line bg-paper"
      data-testid="groups-panel"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5">
        <h2 className="text-base font-semibold text-ink">
          Groups{' '}
          <span className="ml-1 text-sm font-normal text-ink-3">
            {groups.length}
            {groups.length > 0 && ` · ${pluralise(coacheeCount, 'coachee')}`}
          </span>
        </h2>
        {groups.length > 0 && canEdit && (
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

      {!view.can.seeAllGroups && (
        <p
          className="border-b border-line px-5 py-2 text-xs text-ink-3"
          data-testid="groups-scope-note"
        >
          Your groups. Other groups on this sandbox aren’t shown.
        </p>
      )}
      <div className="px-5 py-4">
        {groups.length === 0 && !canEdit ? (
          <p className="text-sm text-ink-3" data-testid="groups-empty">
            {view.can.seeAllGroups
              ? 'No groups yet.'
              : 'You’re not in a group yet.'}
          </p>
        ) : groups.length === 0 ? (
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
          // Sized by content, not by viewport: the rail takes 340px out of the
          // page, so a viewport breakpoint snapped the cards between one and
          // three across at a single pixel of window width.
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
            {groups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                onEdit={canEdit ? onEdit : undefined}
                onDelete={canEdit ? onDelete : undefined}
              />
            ))}
            {canEdit && (
              <button
                type="button"
                onClick={onNew}
                className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-ink-4 text-sm text-ink-3 transition-colors hover:border-ink hover:text-ink"
                data-testid="add-another-group"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add another group
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
