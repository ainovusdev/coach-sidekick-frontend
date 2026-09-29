'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  sandboxErrorDetail,
  useSetCountsFrom,
} from '@/hooks/mutations/use-sandbox-mutations'
import { queryKeys } from '@/lib/query-client'
import { firstName, fmtDay } from '@/lib/sandbox/format'
import { describeWindowChange } from '@/lib/sandbox/window-change'
import { SandboxService } from '@/services/sandbox-service'
import type { GroupWindow } from '@/types/sandbox'

/**
 * Group drawer → people who joined after the group began. Their earlier
 * sessions don't count until the day they count from is corrected.
 */
export function CountsFromList({
  sandboxId,
  groupId,
}: {
  sandboxId: string
  groupId: string
}) {
  const [editing, setEditing] = useState<GroupWindow | null>(null)
  const { data: windows } = useQuery({
    queryKey: queryKeys.sandboxes.groupWindows(sandboxId, groupId),
    queryFn: () => SandboxService.groupWindows(sandboxId, groupId),
    // Not everyone who opens the drawer may correct dates; they see nothing.
    retry: false,
  })
  const late = (windows ?? []).filter(
    w => w.kind === 'coachee' && w.is_late && w.can_correct,
  )
  if (late.length === 0) return null

  return (
    <div
      className="rounded-lg border border-line bg-surface-2 px-3 py-2.5"
      data-testid="counts-from-list"
    >
      <p className="text-xs font-medium text-ink">Joined after the start</p>
      <p className="text-xs text-ink-3">
        Sessions before the day they count from aren’t part of this agreement.
      </p>
      <ul className="mt-2 space-y-1.5">
        {late.map(w => (
          <li
            key={w.enrollment_id}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm"
            data-testid="counts-from-row"
          >
            <span className="min-w-0 truncate text-ink">
              {w.name || w.email}
            </span>
            <span className="flex items-center gap-2 text-xs text-ink-2">
              Counts from {fmtDay(w.starts_on, true)}
              <button
                type="button"
                className="text-ds-accent hover:underline"
                onClick={() => setEditing(w)}
                data-testid="counts-from-change"
              >
                Change
              </button>
            </span>
          </li>
        ))}
      </ul>
      <CountsFromDialog
        sandboxId={sandboxId}
        window={editing}
        coaches={(windows ?? []).filter(w => w.kind === 'coach')}
        onOpenChange={open => !open && setEditing(null)}
      />
    </div>
  )
}

function CountsFromDialog({
  sandboxId,
  window: target,
  coaches,
  onOpenChange,
}: {
  sandboxId: string
  window: GroupWindow | null
  coaches: GroupWindow[]
  onOpenChange: (open: boolean) => void
}) {
  const setCountsFrom = useSetCountsFrom(sandboxId)
  const [day, setDay] = useState<string | null>(null)
  const [coachIds, setCoachIds] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [refusal, setRefusal] = useState<string | null>(null)

  useEffect(() => {
    if (!target) return
    setDay(target.earliest)
    setCoachIds([])
    setReason('')
    setRefusal(null)
  }, [target])

  const enrollmentId = target?.enrollment_id ?? ''
  const valid = !!target && !!day && day >= target.earliest
  const preview = useQuery({
    queryKey: [
      ...queryKeys.sandboxes.detail(sandboxId),
      'counts-from-preview',
      enrollmentId,
      day,
      coachIds,
    ],
    queryFn: () =>
      SandboxService.previewCountsFrom(sandboxId, enrollmentId, {
        counts_from: day as string,
        coach_enrollment_ids: coachIds,
      }),
    enabled: valid,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  })

  if (!target) return null
  const first = firstName(target.name, target.email)
  const previewRefusal = preview.error
    ? (sandboxErrorDetail(preview.error)?.message ??
      'Could not work out what this changes.')
    : null
  // A coach added later still keeps those sessions out: both have to cover the day.
  const lateCoaches = (preview.data?.late_coaches ?? [])
    .map(l => coaches.find(c => c.enrollment_id === l.enrollment_id))
    .filter((c): c is GroupWindow => !!c && c.can_correct)
  const offered = [
    ...lateCoaches,
    ...coaches.filter(
      c =>
        coachIds.includes(c.enrollment_id) &&
        !lateCoaches.some(l => l.enrollment_id === c.enrollment_id),
    ),
  ]

  const save = async () => {
    if (!day || !preview.data) return
    setRefusal(null)
    try {
      await setCountsFrom.mutateAsync({
        enrollmentId,
        data: {
          counts_from: day,
          coach_enrollment_ids: coachIds,
          reason: reason.trim(),
          expected_basis: preview.data.basis,
        },
      })
      onOpenChange(false)
    } catch (error) {
      const detail = sandboxErrorDetail(error)
      if (detail?.code === 'stale_preview') {
        setRefusal('Something changed while you were looking. Check it again.')
        void preview.refetch()
      } else if (detail) setRefusal(detail.message)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md"
        data-testid="counts-from-dialog"
      >
        <DialogHeader>
          <DialogTitle>When {first}’s sessions start counting</DialogTitle>
          <DialogDescription>
            {first} was added on {fmtDay(target.starts_on, true)}. If coaching
            began earlier, move the date back and those sessions count. The
            earliest it can be is {fmtDay(target.earliest, true)}
            {target.earliest === target.group_starts_on
              ? ', when the group starts.'
              : '.'}
          </DialogDescription>
        </DialogHeader>

        <DueDateField
          id="counts-from-day"
          label="Counts from"
          value={day}
          onChange={v => {
            setDay(v)
            setRefusal(null)
          }}
          required
        />
        {day && day < target.earliest && (
          <p
            className="text-xs text-amber-token"
            data-testid="counts-from-early"
          >
            That’s before {fmtDay(target.earliest, true)}. To go earlier, move
            the group’s start first.
          </p>
        )}

        {offered.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-ink-3">
              A session counts only when its coach was in the group that day
              too. Also move:
            </p>
            {offered.map(c => (
              <Label
                key={c.enrollment_id}
                className="flex cursor-pointer items-center gap-2 text-sm font-normal"
              >
                <Checkbox
                  checked={coachIds.includes(c.enrollment_id)}
                  onCheckedChange={v =>
                    setCoachIds(prev =>
                      v === true
                        ? [...prev, c.enrollment_id]
                        : prev.filter(x => x !== c.enrollment_id),
                    )
                  }
                  data-testid="counts-from-coach"
                />
                {c.name || c.email}
                <span className="text-xs text-ink-3">
                  coaching here since {fmtDay(c.starts_on)}
                </span>
              </Label>
            ))}
          </div>
        )}

        <p
          className="rounded-md bg-surface-2 px-3 py-2 text-sm text-ink"
          data-testid="counts-from-preview"
          aria-live="polite"
        >
          {!valid
            ? 'Pick a date to see what it changes.'
            : preview.isFetching
              ? 'Working it out…'
              : previewRefusal
                ? previewRefusal
                : preview.data
                  ? describeWindowChange(preview.data)
                  : ''}
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="counts-from-reason">Why</Label>
          <Textarea
            id="counts-from-reason"
            rows={2}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Coaching began before they were added here."
            data-testid="counts-from-reason"
          />
        </div>

        {refusal && (
          <p
            className="rounded-md bg-amber-token-bg px-3 py-2 text-xs text-amber-token"
            data-testid="counts-from-refusal"
          >
            {refusal}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-ink text-ink-on-dark hover:bg-ink/90"
            disabled={
              !valid ||
              !preview.data ||
              preview.isFetching ||
              !reason.trim() ||
              setCountsFrom.isPending
            }
            onClick={save}
            data-testid="counts-from-save"
          >
            {setCountsFrom.isPending ? 'Saving…' : 'Save date'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
