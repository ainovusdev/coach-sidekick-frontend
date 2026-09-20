'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, ChevronRight, Lock, Plus } from 'lucide-react'
import { PersonAvatar } from '@/components/ui/person-avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  dueText,
  isDone,
  whoText,
  type CommitmentSection,
  type ViewBy,
} from '@/lib/sandbox/commitments-view'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'
import { cn } from '@/lib/utils'
import type { SandboxCommitmentRow } from '@/types/sandbox-commitments'

/**
 * One row. Two temperaments, one shape:
 *
 * - a row the viewer reads in full opens on click and ticks done;
 * - a coaching commitment the viewer only follows is still — no hover, no tick,
 *   a small lock that says why. It should look calm, not broken.
 */
export function TrackedRow({
  row,
  by,
  sectionUserId,
  today,
  onOpen,
  onToggle,
}: {
  row: SandboxCommitmentRow
  by: ViewBy
  /** Whose section this row sits in, so the row need not repeat their name. */
  sectionUserId?: string | null
  today: string
  onOpen: (id: string) => void
  onToggle: (row: SandboxCommitmentRow) => void
}) {
  const due = dueText(row, today)
  const done = isDone(row)
  const who = whoText(row, by, sectionUserId)
  // A row the viewer only follows gets a quiet dot, never a ring that looks
  // like something to tick.
  const trackedMark = (
    <span className="flex h-[18px] w-[18px] flex-none items-center justify-center">
      {done ? (
        <Check className="h-3.5 w-3.5 text-forest" strokeWidth={3} />
      ) : (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            row.status === 'in_progress' ? 'bg-ds-accent' : 'bg-ink-4',
          )}
        />
      )}
    </span>
  )
  const mark = (
    <span
      className={cn(
        'flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border',
        done
          ? 'border-forest bg-forest text-paper'
          : row.status === 'in_progress'
            ? 'border-ds-accent'
            : 'border-line-strong',
      )}
    >
      {done ? (
        <Check className="h-3 w-3" strokeWidth={3} />
      ) : row.status === 'in_progress' ? (
        <span className="h-2 w-2 rounded-full bg-ds-accent" />
      ) : null}
    </span>
  )

  return (
    <div
      className={cn(
        'flex items-start gap-3 border-b border-line px-4 py-2.5 last:border-b-0 sm:items-center',
        row.can_open && 'hover:bg-surface-2',
      )}
      data-testid="commitment-item"
      data-kind={row.kind}
      data-tracked={!row.can_open}
    >
      {row.can_open ? (
        <button
          type="button"
          onClick={() => onToggle(row)}
          aria-label={done ? `Reopen ${row.title}` : `Mark ${row.title} done`}
          className="mt-0.5 flex-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-accent sm:mt-0"
          data-testid="commitment-tick"
        >
          {mark}
        </button>
      ) : (
        <span className="mt-0.5 sm:mt-0" aria-hidden>
          {trackedMark}
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-0.5 sm:flex-row sm:items-center">
        {row.can_open ? (
          <button
            type="button"
            onClick={() => onOpen(row.id)}
            className={cn(
              'min-w-0 flex-1 truncate text-left text-sm hover:underline hover:underline-offset-4',
              done ? 'text-ink-3 line-through' : 'text-ink',
            )}
            data-testid="commitment-title"
          >
            {row.title}
          </button>
        ) : (
          <span
            className={cn(
              'flex min-w-0 flex-1 items-center gap-1.5 text-sm',
              done ? 'text-ink-3 line-through' : 'text-ink',
            )}
            data-testid="commitment-title"
          >
            <span className="truncate">{row.title}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex-none text-ink-4"
                  aria-label="Why this does not open"
                  data-testid="commitment-lock"
                >
                  <Lock className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Between coach and coachee — you see the title, status and date.
              </TooltipContent>
            </Tooltip>
          </span>
        )}
        {who && (
          <span className="truncate text-xs text-ink-3 sm:w-52 sm:flex-none">
            {who}
          </span>
        )}
      </div>

      <span
        className={cn(
          'flex-none whitespace-nowrap text-xs tabular-nums sm:w-24 sm:text-right',
          due.late ? 'font-medium text-vermillion' : 'text-ink-3',
        )}
        data-testid="commitment-due"
      >
        {due.text}
      </span>
    </div>
  )
}

export function CommitmentSectionCard({
  section,
  by,
  today,
  sandboxId,
  defaultOpen,
  forceOpen,
  onOpen,
  onToggle,
  onAdd,
}: {
  section: CommitmentSection
  by: Exclude<ViewBy, 'list'>
  today: string
  sandboxId: string
  defaultOpen: boolean
  /** A filter is on: what it found should not be folded away. */
  forceOpen: boolean
  onOpen: (id: string) => void
  onToggle: (row: SandboxCommitmentRow) => void
  onAdd: () => void
}) {
  const [chosen, setChosen] = useState<boolean | null>(null)
  const open = chosen ?? (forceOpen ? section.rows.length > 0 : defaultOpen)
  const href =
    by === 'coach' && section.userId
      ? sandboxEntityHref(sandboxId, 'coach', section.userId)
      : by === 'coachee' && section.memberId
        ? sandboxEntityHref(sandboxId, 'client', section.memberId)
        : null
  const pct = section.total ? (section.done / section.total) * 100 : 0

  return (
    <section
      className="overflow-hidden rounded-xl border border-line bg-paper"
      data-testid="commitment-section"
      data-open={open}
    >
      <header className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setChosen(!open)}
          aria-expanded={open}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${section.name}`}
          className="flex-none rounded text-ink-3 hover:text-ink"
          data-testid="commitment-section-toggle"
        >
          <ChevronRight
            className={cn('h-4 w-4 transition-transform', open && 'rotate-90')}
          />
        </button>
        {section.memberId ? (
          <PersonAvatar name={section.name} size="sm" />
        ) : (
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-surface-2 text-[10px] font-medium text-ink-3">
            T
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">
            {href ? (
              <Link
                href={href}
                className="hover:text-ds-accent hover:underline"
              >
                {section.name}
              </Link>
            ) : (
              section.name
            )}
          </p>
          {section.fact && (
            <p className="truncate text-xs text-ink-3">{section.fact}</p>
          )}
        </div>
        <p className="flex-none text-right text-xs tabular-nums text-ink-3">
          {section.total === 0 ? 'Nothing yet' : `${section.open} open`}
          {section.overdue > 0 && (
            <span className="font-medium text-vermillion">
              {' '}
              · {section.overdue} overdue
            </span>
          )}
        </p>
        {/* How much of what was agreed is done. Hidden on a phone, where the
            two numbers beside it already say it. */}
        <div
          className={cn(
            'hidden w-28 flex-none items-center gap-2 md:flex',
            section.total === 0 && 'invisible',
          )}
          aria-label={`${section.done} of ${section.total} done`}
        >
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
            <span
              className="block h-full rounded-full bg-forest"
              style={{ width: `${pct}%` }}
            />
          </span>
          <span className="w-9 text-right text-[11px] tabular-nums text-ink-3">
            {section.done}/{section.total}
          </span>
        </div>
      </header>

      {open && (
        <div className="border-t border-line">
          {section.rows.length === 0 ? (
            <p className="px-4 py-3 text-xs text-ink-3">Nothing open.</p>
          ) : (
            section.rows.map(r => (
              <TrackedRow
                key={r.id}
                row={r}
                by={by}
                sectionUserId={section.userId}
                today={today}
                onOpen={onOpen}
                onToggle={onToggle}
              />
            ))
          )}
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center gap-2 border-t border-line px-4 py-2 text-left text-xs text-ink-3 hover:bg-surface-2 hover:text-ink"
            data-testid="commitment-section-add"
          >
            <Plus className="h-3.5 w-3.5" />
            Add a commitment
          </button>
        </div>
      )}
    </section>
  )
}
