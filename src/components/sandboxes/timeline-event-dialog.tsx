'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DueDateField } from '@/components/ui/due-date-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useAddEvent,
  useMoveEvent,
} from '@/hooks/mutations/use-sandbox-mutations'
import { useSandboxChanges } from '@/hooks/queries/use-sandbox-details'
import { useMovePreview } from '@/hooks/queries/use-sandboxes'
import { describeMilestoneEffects } from '@/lib/sandbox/milestones-view'
import { useInsightViewer } from '@/hooks/queries/use-sandbox-insights'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'
import { fmtDay, pluralise } from '@/lib/sandbox/format'
import { daysBetween, parseDateOnly } from '@/lib/sandbox/term'
import type { SandboxOverview, TimelineEvent } from '@/types/sandbox'
import type { SandboxChangeItem } from '@/types/sandbox-details'

export type TimelineDialogState =
  | { mode: 'adjust'; event: TimelineEvent }
  | { mode: 'add' }
  | null

/** "check_in:2" → 2 */
function checkinOrdinal(key: string | null): number | null {
  if (!key || !key.startsWith('check_in:')) return null
  const n = Number(key.split(':')[1])
  return Number.isFinite(n) ? n : null
}

/**
 * One dialog for both hand adjustments: moving a window (any event) and
 * adding an extra event with a reason. Windows, not dates: always a start
 * and an end.
 */
export function TimelineEventDialog({
  state,
  onClose,
  overview,
}: {
  state: TimelineDialogState
  onClose: () => void
  overview: SandboxOverview
}) {
  const { sandbox, timeline } = overview
  const move = useMoveEvent(sandbox.id)
  const add = useAddEvent(sandbox.id)
  const event = state?.mode === 'adjust' ? state.event : null
  const open = state !== null

  const [label, setLabel] = useState('')
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')
  const [note, setNote] = useState('')
  const [shiftFollowing, setShiftFollowing] = useState(true)

  useEffect(() => {
    if (!open) return
    setLabel(event?.label ?? '')
    setStart(event?.window_start ?? '')
    setEnd(event?.window_end ?? '')
    setNote('')
    setShiftFollowing(true)
  }, [open, event])

  const startDate = parseDateOnly(start)
  const endDate = parseDateOnly(end)
  const termEnd = parseDateOnly(sandbox.term_end)!

  const laterCheckins = useMemo(() => {
    const mine = checkinOrdinal(event?.gen_key ?? null)
    if (mine == null) return 0
    return timeline.filter(e => {
      const o = checkinOrdinal(e.gen_key)
      return e.kind === 'check_in' && o != null && o > mine
    }).length
  }, [event, timeline])

  const deltaDays =
    event && startDate
      ? daysBetween(parseDateOnly(event.window_start)!, startDate)
      : 0

  const problem = (() => {
    if (!startDate || !endDate) return 'Pick a start and an end.'
    if (endDate < startDate)
      return 'The window has to end on or after it starts.'
    if (event?.kind === 'results_review' && startDate <= termEnd)
      return `The results review always sits after the term, which ends ${fmtDay(sandbox.term_end, true)}.`
    if (state?.mode === 'add' && !label.trim()) return 'Give the event a name.'
    if (state?.mode === 'add' && !note.trim())
      return 'Say why it is being added.'
    if (event?.is_custom && !label.trim()) return 'Give the event a name.'
    return null
  })()

  const unchanged =
    !!event &&
    start === event.window_start &&
    end === event.window_end &&
    (!event.is_custom || label.trim() === event.label)

  const pending = move.isPending || add.isPending
  const canSave = !problem && !unchanged && !pending

  // What the move does to people's personal milestones — only the windows
  // that carry them (gold sealing, midpoint reporting, results review).
  const carriesMilestones =
    !!event &&
    !!event.gen_key &&
    ['gold_sealing', 'midpoint_reporting', 'results_review'].includes(
      event.kind,
    )
  const preview = useMovePreview(
    sandbox.id,
    event?.id,
    start,
    end,
    open && carriesMilestones && !problem && !unchanged,
  )

  const save = async () => {
    if (!canSave) return
    if (event) {
      await move.mutateAsync({
        eventId: event.id,
        data: {
          window_start: start,
          window_end: end,
          ...(event.is_custom && label.trim() !== event.label
            ? { label: label.trim() }
            : {}),
          shift_following:
            shiftFollowing && laterCheckins > 0 && deltaDays !== 0,
          ...(note.trim() ? { reason: note.trim() } : {}),
        },
      })
    } else {
      await add.mutateAsync({
        label: label.trim(),
        window_start: start,
        window_end: end,
        note: note.trim(),
      })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {event ? `Adjust ${event.label}` : 'Add an event'}
          </DialogTitle>
          <DialogDescription>
            {event
              ? 'Windows, not dates: a start and an end. This one is kept when the timeline regenerates.'
              : 'An extra event for this contract, with a reason. It is kept when the timeline regenerates.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {(!event || event.is_custom) && (
            <div className="space-y-2">
              <Label htmlFor="event-label">Name</Label>
              <Input
                id="event-label"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Board offsite"
                maxLength={100}
                autoFocus={!event}
              />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <DueDateField
              id="event-start"
              label="Starts"
              value={start}
              onChange={v => setStart(v ?? '')}
              required
            />
            <DueDateField
              id="event-end"
              label="Ends"
              value={end}
              onChange={v => setEnd(v ?? '')}
              required
            />
          </div>

          {event && laterCheckins > 0 && (
            <label
              className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm"
              data-testid="shift-following"
            >
              <Checkbox
                checked={shiftFollowing}
                onCheckedChange={v => setShiftFollowing(v === true)}
                disabled={deltaDays === 0}
                className="mt-0.5"
                id="shift-following"
              />
              <span className="text-ink-2">
                Also shift the{' '}
                {laterCheckins === 1
                  ? 'later check-in'
                  : `${laterCheckins} later check-ins`}{' '}
                by the same amount
                {deltaDays !== 0 && (
                  <span className="whitespace-nowrap text-ink-3">
                    {' '}
                    ({deltaDays > 0 ? '+' : '−'}
                    {pluralise(Math.abs(deltaDays), 'day')})
                  </span>
                )}
                {deltaDays === 0 && (
                  <span className="block text-xs text-ink-3">
                    Applies once the start moves.
                  </span>
                )}
              </span>
            </label>
          )}

          <div className="space-y-2">
            <Label htmlFor="event-note">
              {event ? 'Why is it moving?' : 'Why is it being added?'}
              {event && (
                <span className="ml-1 font-normal text-ink-3">(optional)</span>
              )}
            </Label>
            <Textarea
              id="event-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={
                event
                  ? 'The client asked to push the report a fortnight.'
                  : 'The client asked for a leadership offsite mid-term.'
              }
            />
          </div>

          {event && carriesMilestones && !unchanged && !problem && (
            <p
              className="text-xs text-ink-3"
              data-testid="move-preview"
              aria-live="polite"
            >
              {preview.isFetching && !preview.data
                ? 'Working out whose dates follow…'
                : preview.isError
                  ? 'Could not work out whose dates follow.'
                  : describeMilestoneEffects(preview.data, event.label)}
            </p>
          )}

          {event && <EventHistory sandboxId={sandbox.id} event={event} />}

          {problem && (start || end || label || note) && !unchanged && (
            <p className="text-xs text-amber-token" data-testid="event-problem">
              {problem}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-ink text-ink-on-dark hover:bg-ink/90"
            disabled={!canSave}
            onClick={save}
            data-testid="event-save"
          >
            {pending ? 'Saving…' : event ? 'Move window' : 'Add event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * What has happened to this window, from the sandbox's log. The log began on
 * a day; a window adjusted before that says so rather than pretending it was
 * never touched.
 */
function EventHistory({
  sandboxId,
  event,
}: {
  sandboxId: string
  event: TimelineEvent
}) {
  const viewer = useInsightViewer()
  const query = useSandboxChanges(sandboxId, viewer, {
    record_type: 'timeline_event',
    record_id: event.id,
    limit: 10,
  })
  const page = query.data?.pages[0]
  if (query.isError || (page && !page.visible)) return null
  const items: SandboxChangeItem[] = page?.items ?? []
  return (
    <div
      className="rounded-lg border border-line bg-surface-2 px-3 py-2.5"
      data-testid="event-history"
    >
      <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
        History
      </h4>
      {query.isPending ? (
        <p className="mt-1.5 text-xs text-ink-3" role="status">
          Loading…
        </p>
      ) : items.length === 0 ? (
        <p
          className="mt-1.5 text-xs text-ink-3"
          data-testid="event-history-none"
        >
          {event.is_hand_adjusted
            ? 'Adjusted before changes were recorded.'
            : 'No changes recorded for this window.'}
        </p>
      ) : (
        <ol className="mt-1.5 space-y-1.5">
          {items.map(item => (
            <li key={item.id} className="text-xs leading-relaxed text-ink-2">
              {item.summary}
              {item.cause && (
                <span className="text-ink-3"> · {item.cause}</span>
              )}
              <time
                className="ml-1.5 text-ink-3"
                dateTime={item.created_at}
                title={formatDate(item.created_at, 'PPP p')}
              >
                {formatRelativeTime(item.created_at)}
              </time>
            </li>
          ))}
          {query.hasNextPage && (
            <li className="text-xs text-ink-3">
              Earlier changes are in the Activity tab.
            </li>
          )}
        </ol>
      )}
    </div>
  )
}
