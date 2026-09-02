'use client'

import { Fragment, useState } from 'react'
import { MoreHorizontal, Pencil, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  TimelineEventDialog,
  type TimelineDialogState,
} from '@/components/sandboxes/timeline-event-dialog'
import { RemoveEventDialog } from '@/components/sandboxes/remove-event-dialog'
import { RegenerateDialog } from '@/components/sandboxes/regenerate-dialog'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { useRestoreEvent } from '@/hooks/mutations/use-sandbox-mutations'
import { fmtWindow, pluralise } from '@/lib/sandbox/format'
import { daysBetween, parseDateOnly } from '@/lib/sandbox/term'
import { cn } from '@/lib/utils'
import type { SandboxOverview, TimelineEvent } from '@/types/sandbox'

function stateLabel(
  ev: TimelineEvent,
  index: number,
  events: TimelineEvent[],
  today: string,
): string {
  if (ev.state === 'past') return 'Past'
  if (ev.state === 'current') return 'Current'
  const firstUpcoming = events.findIndex(e => e.state === 'upcoming')
  if (index !== firstUpcoming) return 'Upcoming'
  if (index === 0) return 'First'
  const days = daysBetween(
    parseDateOnly(today)!,
    parseDateOnly(ev.window_start)!,
  )
  if (days <= 0) return 'Next'
  return `Next · in ${pluralise(days, 'day')}`
}

/** Count of hand-touched rows: moved windows, added events, removed events. */
export function handAdjustedCount(overview: SandboxOverview): number {
  return (
    overview.timeline.filter(e => e.is_hand_adjusted).length +
    overview.timeline_removed.length
  )
}

export function TimelinePanel({ overview }: { overview: SandboxOverview }) {
  const { timeline, timeline_removed: removed, today, sandbox } = overview
  const [dialog, setDialog] = useState<TimelineDialogState>(null)
  const [removing, setRemoving] = useState<TimelineEvent | null>(null)
  const [regenOpen, setRegenOpen] = useState(false)
  const [showRemoved, setShowRemoved] = useState(false)
  const restore = useRestoreEvent(sandbox.id)
  const canEdit = useSandboxView().can.editTimeline

  const showToday = sandbox.status === 'active'
  // Insert the TODAY marker after the last event that has started.
  const todayIndex = showToday
    ? timeline.filter(e => e.window_start <= today).length
    : -1
  const adjusted = handAdjustedCount(overview)
  const movedCount = timeline.filter(e => e.is_hand_adjusted).length

  const caption =
    adjusted === 0
      ? `${pluralise(timeline.length, 'event')}, generated from the term`
      : `${pluralise(timeline.length, 'event')} · ${pluralise(movedCount, 'adjustment')} by hand`

  return (
    <section
      id="timeline"
      className="scroll-mt-6 rounded-xl border border-line bg-paper"
      data-testid="timeline-panel"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5">
        <div className="flex items-baseline gap-3">
          <h2 className="text-base font-semibold text-ink">Timeline</h2>
          <span className="text-xs text-ink-3" data-testid="timeline-caption">
            {caption}
          </span>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1">
            {adjusted > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs text-ink-2"
                onClick={() => setRegenOpen(true)}
                data-testid="regenerate-timeline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate…
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-ink-2"
              onClick={() => setDialog({ mode: 'add' })}
              data-testid="add-event"
            >
              <Plus className="h-3.5 w-3.5" />
              Add event
            </Button>
          </div>
        )}
      </header>

      <div className="overflow-x-auto px-5 py-4">
        <ol className="flex min-w-max items-stretch gap-3">
          {timeline.map((ev, i) => (
            <Fragment key={ev.id}>
              {showToday && todayIndex === i && <TodayMarker />}
              <li
                className={cn(
                  'group relative flex w-48 flex-col rounded-lg border px-3.5 py-3',
                  ev.state === 'current'
                    ? 'border-vermillion/40 bg-vermillion-bg'
                    : ev.state === 'past'
                      ? 'border-line bg-surface-2'
                      : 'border-line bg-paper',
                )}
                data-testid="timeline-event"
                data-kind={ev.kind}
                data-adjusted={ev.is_hand_adjusted ? 'true' : 'false'}
              >
                <div className="flex items-start justify-between gap-1">
                  <span
                    className={cn(
                      'text-sm font-medium leading-tight',
                      ev.state === 'past' ? 'text-ink-3' : 'text-ink',
                    )}
                    title={ev.is_custom && ev.note ? ev.note : undefined}
                  >
                    {ev.label}
                  </span>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-mr-1.5 -mt-1 h-6 w-6 shrink-0 text-ink-4 hover:text-ink"
                          aria-label={`Actions for ${ev.label}`}
                          data-testid="event-menu"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() =>
                            setDialog({ mode: 'adjust', event: ev })
                          }
                          data-testid="adjust-window"
                        >
                          Adjust window
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setRemoving(ev)}
                          data-testid="remove-event"
                        >
                          Remove…
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <span className="mt-1 font-mono text-[11px] text-ink-3">
                  {fmtWindow(ev.window_start, ev.window_end)}
                </span>
                <span
                  className={cn(
                    'mt-3 h-1 rounded-full',
                    ev.state === 'current'
                      ? 'bg-vermillion'
                      : ev.state === 'past'
                        ? 'bg-ink-4'
                        : 'bg-surface-3',
                  )}
                  aria-hidden
                />
                <span className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider',
                      ev.state === 'current' ? 'text-vermillion' : 'text-ink-3',
                    )}
                  >
                    {stateLabel(ev, i, timeline, today)}
                  </span>
                  {ev.is_hand_adjusted && (
                    <span
                      className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-ink-3"
                      title={
                        ev.is_custom
                          ? 'Added by hand'
                          : 'Moved by hand — kept when the timeline regenerates'
                      }
                      data-testid="hand-adjusted"
                    >
                      <Pencil className="h-2.5 w-2.5" aria-hidden />
                      {ev.is_custom ? 'Added' : 'Adjusted'}
                    </span>
                  )}
                </span>
              </li>
            </Fragment>
          ))}
          {showToday && todayIndex >= timeline.length && <TodayMarker />}
        </ol>
      </div>

      <div className="border-t border-line px-5 py-3 text-xs text-ink-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p>
            {canEdit
              ? 'Changing the term offers to regenerate. Hand-adjusted events are kept unless you say otherwise.'
              : 'Windows are set by the account executive. Dates can move.'}
          </p>
          {canEdit && removed.length > 0 && (
            <button
              type="button"
              className="text-ink-2 underline-offset-2 hover:underline"
              onClick={() => setShowRemoved(v => !v)}
              data-testid="removed-toggle"
            >
              {pluralise(removed.length, 'event')} removed by hand ·{' '}
              {showRemoved ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
        {canEdit && showRemoved && removed.length > 0 && (
          <ul className="mt-3 divide-y divide-line rounded-lg border border-dashed border-line">
            {removed.map(ev => (
              <li
                key={ev.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2"
                data-testid="removed-event"
              >
                <div className="min-w-0">
                  <span className="text-sm text-ink-2 line-through decoration-ink-4">
                    {ev.label}
                  </span>
                  <span className="ml-2 font-mono text-[11px] text-ink-3">
                    {fmtWindow(ev.window_start, ev.window_end)}
                  </span>
                  {ev.removed_reason && (
                    <p className="text-xs text-ink-3">“{ev.removed_reason}”</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={restore.isPending}
                  onClick={() => restore.mutate(ev.id)}
                  data-testid="restore-event"
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canEdit && (
        <>
          <TimelineEventDialog
            state={dialog}
            onClose={() => setDialog(null)}
            overview={overview}
          />
          <RemoveEventDialog
            event={removing}
            onOpenChange={o => !o && setRemoving(null)}
            sandboxId={sandbox.id}
          />
          <RegenerateDialog
            open={regenOpen}
            onOpenChange={setRegenOpen}
            overview={overview}
          />
        </>
      )}
    </section>
  )
}

function TodayMarker() {
  return (
    <li
      className="flex w-6 flex-col items-center justify-center"
      aria-label="Today"
    >
      <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-vermillion">
        Today
      </span>
      <span className="mt-1 w-px flex-1 bg-vermillion" aria-hidden />
    </li>
  )
}
