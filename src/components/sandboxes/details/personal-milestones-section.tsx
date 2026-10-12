'use client'

/**
 * A coachee's own milestones on their page (our side only): gold sealing,
 * midpoint input, results review — each with its window, where the dates come
 * from, and who holds it.
 */

import { Check } from 'lucide-react'
import { MilestoneChip } from '@/components/sandboxes/commitments/milestone-sections'
import { Empty, Section } from '@/components/sandboxes/section'
import { useUpdateCommitment } from '@/hooks/mutations/use-commitment-mutations'
import { firstName, fmtWindow, pluralise } from '@/lib/sandbox/format'
import { occurrenceRank, sourceChip } from '@/lib/sandbox/milestones-view'
import { parseDateOnly } from '@/lib/sandbox/term'
import { cn } from '@/lib/utils'
import type { SandboxEntityDetail } from '@/types/sandbox-details'
import type { PersonalMilestoneRow } from '@/types/sandbox-milestones'

function late(row: PersonalMilestoneRow, today: string): number {
  if (row.status !== 'active' && row.status !== 'in_progress') return 0
  const due = parseDateOnly(row.target_date)
  const now = parseDateOnly(today)
  if (!due || !now) return 0
  return Math.max(0, Math.round((now.getTime() - due.getTime()) / 86_400_000))
}

export function PersonalMilestonesSection({
  data,
  onOpen,
}: {
  data: SandboxEntityDetail
  onOpen: (id: string) => void
}) {
  const today = data.analytics.current_contract.as_of
  const rows = [...(data.personal_milestones ?? [])].sort(
    (a, b) =>
      occurrenceRank(a.milestone.occurrence) -
        occurrenceRank(b.milestone.occurrence) ||
      (a.target_date ?? '').localeCompare(b.target_date ?? ''),
  )
  const update = useUpdateCommitment({ silent: true })
  const open = rows.filter(
    r => r.status === 'active' || r.status === 'in_progress',
  ).length
  const overdue = rows.filter(r => late(r, today) > 0).length
  return (
    <Section
      id="milestones"
      title="Milestones"
      sub={
        rows.length === 0
          ? undefined
          : [`${open} open`, overdue > 0 ? `${overdue} overdue` : null]
              .filter(Boolean)
              .join(' · ')
      }
      testId="detail-personal-milestones"
    >
      {rows.length === 0 ? (
        <Empty>
          No personal milestones yet. They are created when this person is
          placed in a group.
        </Empty>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map(row => {
            const m = row.milestone
            const done = row.status === 'completed'
            const inactive = row.status === 'abandoned'
            const days = late(row, today)
            const chip = sourceChip(m, row.status)
            return (
              <li
                key={row.commitment_id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                data-testid="detail-personal-milestone"
                data-occurrence={m.occurrence}
                data-status={row.status}
              >
                <button
                  type="button"
                  disabled={!row.can_edit || inactive || m.sealed}
                  onClick={() =>
                    update.mutate({
                      commitmentId: row.commitment_id,
                      data: { status: done ? 'active' : 'completed' },
                    })
                  }
                  aria-label={
                    done ? `Reopen ${m.label}` : `Mark ${m.label} done`
                  }
                  className={cn(
                    'flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border',
                    done
                      ? 'border-forest bg-forest text-paper'
                      : inactive
                        ? 'border-dashed border-line'
                        : 'border-line-strong',
                    (!row.can_edit || inactive || m.sealed) && 'cursor-default',
                  )}
                  title={
                    m.sealed
                      ? 'Completed because an outcome is sealed'
                      : undefined
                  }
                  data-testid="detail-personal-milestone-tick"
                >
                  {done && <Check className="h-3 w-3" strokeWidth={3} />}
                </button>
                <button
                  type="button"
                  onClick={() => onOpen(row.commitment_id)}
                  className={cn(
                    'min-w-0 flex-1 truncate text-left text-sm hover:underline hover:underline-offset-4',
                    done || inactive ? 'text-ink-3' : 'text-ink',
                    done && 'line-through',
                  )}
                  data-testid="detail-personal-milestone-title"
                >
                  {m.label}
                </button>
                <MilestoneChip
                  text={chip.text}
                  tone={chip.tone}
                  title={chip.title}
                />
                <span className="w-full text-xs text-ink-3 sm:w-auto sm:flex-none">
                  {m.coach_pending ? (
                    <span className="font-medium text-amber-token">
                      Awaiting a coach
                    </span>
                  ) : row.assignee_name ? (
                    `with ${firstName(row.assignee_name)}`
                  ) : null}
                </span>
                <span
                  className={cn(
                    'flex-none font-mono text-[11px] tabular-nums sm:w-32 sm:text-right',
                    days > 0 ? 'font-medium text-vermillion' : 'text-ink-3',
                  )}
                  data-testid="detail-personal-milestone-window"
                >
                  {done
                    ? 'Done'
                    : days > 0
                      ? `${pluralise(days, 'day')} late`
                      : row.start_date && row.target_date
                        ? fmtWindow(row.start_date, row.target_date)
                        : '—'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}
