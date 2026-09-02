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
import { fmtDay, pluralise } from '@/lib/sandbox/format'
import { daysBetween, parseDateOnly } from '@/lib/sandbox/term'
import type { SandboxOverview, TimelineEvent } from '@/types/sandbox'

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

          {!event && (
            <div className="space-y-2">
              <Label htmlFor="event-note">Why is it being added?</Label>
              <Textarea
                id="event-note"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="The client asked for a leadership offsite mid-term."
              />
            </div>
          )}

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
