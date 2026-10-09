'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { PersonAvatar } from '@/components/ui/person-avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'
import { fmtWindow, firstName } from '@/lib/sandbox/format'
import {
  isNotActive,
  milestoneSummary,
  sourceChip,
  windowText,
  type ChipTone,
  type MilestoneCard,
} from '@/lib/sandbox/milestones-view'
import { cn } from '@/lib/utils'
import type { SandboxCommitmentRow } from '@/types/sandbox-commitments'

const CHIP_TONE: Record<ChipTone, string> = {
  quiet: 'border-line text-ink-3',
  info: 'border-ds-accent/40 bg-ds-accent-bg text-ds-accent',
  warn: 'border-amber-token/40 bg-amber-token-bg text-amber-token',
  muted: 'border-line bg-surface-2 text-ink-3',
}

export function MilestoneChip({
  text,
  tone,
  title,
  testId,
}: {
  text: string
  tone: ChipTone
  title?: string
  testId?: string
}) {
  const chip = (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 text-[11px] font-medium',
        CHIP_TONE[tone],
      )}
      data-testid={testId}
    >
      {text}
    </span>
  )
  if (!title) return chip
  return (
    <Tooltip>
      <TooltipTrigger asChild>{chip}</TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  )
}

/**
 * One coachee's milestone: who, which coach (or "Awaiting a coach"), the
 * window with lateness, where the dates come from, and a tick for whoever
 * may edit it.
 */
export function MilestoneRow({
  row,
  today,
  sandboxId,
  onOpen,
  onToggle,
}: {
  row: SandboxCommitmentRow
  today: string
  sandboxId: string
  onOpen: (id: string) => void
  onToggle: (row: SandboxCommitmentRow) => void
}) {
  const m = row.milestone!
  const done = row.status === 'completed'
  const inactive = isNotActive(row)
  const window = windowText(row, today)
  const chip = sourceChip(m, row.status)
  const canEdit = row.can_edit !== false && row.can_open
  const coacheeName = row.coachee?.name ?? m.member_name ?? 'Someone'
  const href = row.coachee?.member_id
    ? sandboxEntityHref(sandboxId, 'client', row.coachee.member_id)
    : null

  const mark = (
    <span
      className={cn(
        'flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border',
        done
          ? 'border-forest bg-forest text-paper'
          : row.status === 'in_progress'
            ? 'border-ds-accent'
            : inactive
              ? 'border-dashed border-line'
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
        inactive && 'opacity-80',
      )}
      data-testid="personal-milestone"
      data-occurrence={m.occurrence}
      data-member={m.member_id}
      data-status={row.status}
      data-follows={m.follows}
    >
      {canEdit && !inactive ? (
        <button
          type="button"
          onClick={() => onToggle(row)}
          aria-label={
            done
              ? `Reopen ${row.title}`
              : m.occurrence === 'gold_sealing'
                ? `Mark ${row.title} done`
                : `Mark ${row.title} done`
          }
          className="mt-0.5 flex-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-accent sm:mt-0"
          data-testid="personal-milestone-tick"
          disabled={m.sealed}
          title={
            m.sealed ? 'Completed because an outcome is sealed' : undefined
          }
        >
          {mark}
        </button>
      ) : (
        <span className="mt-0.5 sm:mt-0" aria-hidden>
          {mark}
        </span>
      )}

      <PersonAvatar name={coacheeName} size="sm" className="hidden sm:flex" />

      <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-1 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
          {href ? (
            <Link
              href={href}
              className={cn(
                'truncate text-sm hover:underline hover:underline-offset-4',
                done || inactive ? 'text-ink-3' : 'text-ink',
              )}
              data-testid="personal-milestone-name"
            >
              {coacheeName}
            </Link>
          ) : (
            <span className="truncate text-sm text-ink">{coacheeName}</span>
          )}
          {m.coach_pending ? (
            <button
              type="button"
              onClick={() => (row.can_open ? onOpen(row.id) : undefined)}
              className={cn(
                'inline-flex items-center rounded-full border border-amber-token/40 bg-amber-token-bg px-2 py-0.5 text-[11px] font-medium text-amber-token',
                row.can_open && 'hover:border-amber-token',
              )}
              data-testid="personal-milestone-awaiting"
            >
              Awaiting a coach
            </button>
          ) : row.assignee ? (
            <span className="truncate text-xs text-ink-3">
              with {firstName(row.assignee.name)}
            </span>
          ) : null}
        </div>
        <div className="flex flex-none flex-wrap items-center gap-1.5 sm:w-auto">
          <MilestoneChip
            text={chip.text}
            tone={chip.tone}
            title={chip.title}
            testId="personal-milestone-source"
          />
          {m.sealed && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-forest"
              data-testid="personal-milestone-sealed"
            >
              <Check className="h-3 w-3" strokeWidth={3} /> Sealed
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-none flex-col items-end gap-0.5 sm:w-40">
        {row.can_open ? (
          <button
            type="button"
            onClick={() => onOpen(row.id)}
            className={cn(
              'whitespace-nowrap text-xs tabular-nums hover:underline hover:underline-offset-4',
              window.late ? 'font-medium text-vermillion' : 'text-ink-2',
              done && 'text-ink-3',
            )}
            data-testid="personal-milestone-window"
            title={
              row.start_date && row.target_date
                ? fmtWindow(row.start_date, row.target_date)
                : undefined
            }
          >
            {done ? 'Done' : window.text}
          </button>
        ) : (
          <span
            className={cn(
              'whitespace-nowrap text-xs tabular-nums',
              window.late ? 'font-medium text-vermillion' : 'text-ink-3',
            )}
            data-testid="personal-milestone-window"
          >
            {done ? 'Done' : window.text}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * One occurrence — Gold sealing, Midpoint reporting, Results review — with
 * the sandbox's own window, a summary sentence whose numbers cut the list,
 * the rows, and the dismissed or dropped ones folded away.
 */
export function MilestoneOccurrenceCard({
  card,
  sandboxWindow,
  today,
  sandboxId,
  onOpen,
  onToggle,
  onSummary,
}: {
  card: MilestoneCard
  /** The sandbox's event for this occurrence, when it has one. */
  sandboxWindow: { window_start: string; window_end: string } | null
  today: string
  sandboxId: string
  onOpen: (id: string) => void
  onToggle: (row: SandboxCommitmentRow) => void
  /** A number in the sentence was pressed: cut the list that way. */
  onSummary: (key: string) => void
}) {
  const [showInactive, setShowInactive] = useState(false)
  const summary = milestoneSummary(card.occurrence, card.counts)
  return (
    <section
      className="overflow-hidden rounded-xl border border-line bg-paper"
      data-testid="personal-milestone-card"
      data-occurrence={card.occurrence}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">{card.label}</h3>
          {sandboxWindow && (
            <p className="font-mono text-[11px] text-ink-3">
              Sandbox:{' '}
              {fmtWindow(sandboxWindow.window_start, sandboxWindow.window_end)}
            </p>
          )}
        </div>
        <p
          className="text-xs tabular-nums text-ink-3"
          data-testid="personal-milestone-summary"
        >
          {summary.length === 0
            ? 'Nothing yet'
            : summary.map((part, i) => (
                <span key={part.key}>
                  {i > 0 && ' · '}
                  <button
                    type="button"
                    onClick={() => onSummary(part.key)}
                    className={cn(
                      'underline-offset-4 hover:underline',
                      part.late ? 'font-medium text-vermillion' : 'text-ink-2',
                    )}
                  >
                    {part.text}
                  </button>
                </span>
              ))}
        </p>
      </header>
      <div className="border-t border-line">
        {card.rows.length === 0 ? (
          <p className="px-4 py-3 text-xs text-ink-3">
            {card.notActive.length ? 'Nothing active.' : 'Nothing here.'}
          </p>
        ) : (
          card.rows.map(r => (
            <MilestoneRow
              key={r.id}
              row={r}
              today={today}
              sandboxId={sandboxId}
              onOpen={onOpen}
              onToggle={onToggle}
            />
          ))
        )}
        {card.notActive.length > 0 && (
          <div className="border-t border-line">
            <button
              type="button"
              onClick={() => setShowInactive(v => !v)}
              aria-expanded={showInactive}
              className="flex w-full items-center gap-1.5 px-4 py-2 text-left text-xs text-ink-3 hover:bg-surface-2 hover:text-ink"
              data-testid="personal-milestone-inactive-toggle"
            >
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  showInactive && 'rotate-90',
                )}
              />
              Not active ({card.notActive.length})
            </button>
            {showInactive &&
              card.notActive.map(r => (
                <MilestoneRow
                  key={r.id}
                  row={r}
                  today={today}
                  sandboxId={sandboxId}
                  onOpen={onOpen}
                  onToggle={onToggle}
                />
              ))}
          </div>
        )}
      </div>
    </section>
  )
}
