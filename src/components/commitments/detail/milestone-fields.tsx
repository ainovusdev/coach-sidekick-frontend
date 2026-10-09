'use client'

/**
 * The parts of the detail panel that belong to a personal milestone: where the
 * row comes from, its window (two dates, not one), who among our side holds
 * it, and the two ways back to the automation's choice.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, Flag, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AssigneeChip } from '@/components/people/assignee-chip'
import { useFollowMilestone } from '@/hooks/mutations/use-commitment-mutations'
import { useMilestoneAssignees } from '@/hooks/queries/use-sandboxes'
import { assigneeOf } from '@/lib/commitments/assignee'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'
import { fmtWindow } from '@/lib/sandbox/format'
import { followsText } from '@/lib/sandbox/milestones-view'
import { cn } from '@/lib/utils'
import type { Commitment } from '@/types/commitment'
import type { PersonalMilestoneInfo } from '@/types/sandbox-milestones'

export type FieldsPatch = (
  patch: Record<string, any>,
  optimistic?: Record<string, any>,
) => void

export function milestoneOf(c: Commitment): PersonalMilestoneInfo | null {
  return c.milestone ?? null
}

/** "Milestone · Gold sealing" and whose it is, over the title. */
export function MilestoneHeaderLine({
  commitment,
}: {
  commitment: Commitment
}) {
  const m = milestoneOf(commitment)
  if (!m) return null
  const href =
    commitment.sandbox_id && m.member_id
      ? sandboxEntityHref(commitment.sandbox_id, 'client', m.member_id)
      : null
  return (
    <div
      className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
      data-testid="milestone-header"
    >
      <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-ink-3">
        <Flag className="h-3 w-3" aria-hidden /> Milestone · {m.label}
      </span>
      {m.member_name && (
        <span className="text-ink-3">
          ·{' '}
          {href ? (
            <Link
              href={href}
              className="text-ink-2 underline-offset-4 hover:underline"
            >
              {m.member_name}
            </Link>
          ) : (
            m.member_name
          )}
        </span>
      )}
    </div>
  )
}

/**
 * The Window cell: "15 Aug – 15 Sep", opening a small dialog with a start and
 * an end. Saving both at once keeps the ledger to one move.
 */
export function MilestoneWindowField({
  commitment,
  onFieldsUpdate,
  readOnly,
}: {
  commitment: Commitment
  onFieldsUpdate: FieldsPatch
  readOnly: boolean
}) {
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState(commitment.start_date ?? '')
  const [end, setEnd] = useState(commitment.target_date ?? '')
  const [reason, setReason] = useState('')
  useEffect(() => {
    if (!open) return
    setStart(commitment.start_date ?? '')
    setEnd(commitment.target_date ?? '')
    setReason('')
  }, [open, commitment.start_date, commitment.target_date])

  const label =
    commitment.start_date && commitment.target_date
      ? fmtWindow(commitment.start_date, commitment.target_date)
      : commitment.target_date
        ? `by ${commitment.target_date}`
        : 'Set window'
  const problem =
    !start || !end
      ? 'Pick a start and an end.'
      : end < start
        ? 'The window has to end on or after it starts.'
        : null
  const unchanged =
    start === (commitment.start_date ?? '') &&
    end === (commitment.target_date ?? '')

  const save = () => {
    if (problem || unchanged) return
    const patch: Record<string, any> = { start_date: start, target_date: end }
    const why = reason.trim()
    onFieldsUpdate(
      why ? { ...patch, reason: why } : patch,
      // The reason rides along; it is not a field on the row.
      { start_date: start, target_date: end },
    )
    setOpen(false)
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-ink-3 ">Window</label>
      <Button
        variant="outline"
        disabled={readOnly}
        onClick={() => setOpen(true)}
        className={cn(
          'h-9 w-full justify-start text-left text-sm font-normal',
          !commitment.target_date && 'text-ink-3',
        )}
        data-testid="milestone-window"
      >
        <CalendarIcon className="h-3.5 w-3.5 mr-2" />
        <span className="truncate">{label}</span>
        {readOnly && (
          <Lock className="ml-auto h-3 w-3 text-ink-4" aria-hidden />
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-[90] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move the window</DialogTitle>
            <DialogDescription>
              A start and an end. Once moved by hand the dates stop following
              the sandbox’s; “Use default dates” brings them back.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <DueDateField
                id="milestone-start"
                label="Starts"
                value={start}
                onChange={v => setStart(v ?? '')}
                required
              />
              <DueDateField
                id="milestone-end"
                label="Ends"
                value={end}
                onChange={v => setEnd(v ?? '')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-reason">
                Why? <span className="font-normal text-ink-3">(optional)</span>
              </Label>
              <Input
                id="milestone-reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                maxLength={500}
                placeholder="They start late; sealing waits for their second session."
                data-testid="milestone-reason"
              />
            </div>
            {problem && !unchanged && (
              <p
                className="text-xs text-amber-token"
                data-testid="milestone-window-problem"
              >
                {problem}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!!problem || unchanged}
              onClick={save}
              data-testid="milestone-window-save"
            >
              Move window
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Who holds the milestone: our side, minus the person it is about. The
 * group's coach is marked, since that is who the automation would pick.
 */
export function MilestoneAssigneeField({
  commitment,
  onFieldsUpdate,
  readOnly,
}: {
  commitment: Commitment
  onFieldsUpdate: FieldsPatch
  readOnly: boolean
}) {
  const m = milestoneOf(commitment)
  const assignee = assigneeOf(commitment)
  const query = useMilestoneAssignees(commitment.sandbox_id, m?.id, !readOnly)
  const people = query.data?.people ?? []
  const current = commitment.assigned_to_id ?? ''
  // The current holder may have left our side; still show them.
  const options =
    current && !people.some(p => p.user_id === current) && assignee
      ? [
          {
            user_id: current,
            member_id: '',
            name: assignee.name ?? 'Current holder',
            roles: [],
            is_default: false,
            is_current: true,
          },
          ...people,
        ]
      : people

  const pick = (userId: string) => {
    const next = userId === '__none' ? null : userId
    const person = options.find(p => p.user_id === next)
    onFieldsUpdate(
      { assigned_to_id: next },
      {
        assigned_to_id: next,
        assigned_to_name: person?.name ?? null,
        assignee: next
          ? {
              user_id: next,
              client_id: null,
              name: person?.name ?? null,
              email: null,
              has_account: true,
              roles: person?.roles ?? [],
            }
          : null,
        assignee_kind: next ? 'user' : 'none',
        is_coach_commitment: !!next,
      },
    )
  }

  return (
    <div className="space-y-1 min-w-0">
      <label className="text-xs font-medium text-ink-3 ">Assignee</label>
      {readOnly ? (
        <div className="h-9 flex items-center">
          <AssigneeChip assignee={assignee} size="sm" />
        </div>
      ) : (
        <Select
          value={current || '__none'}
          onValueChange={pick}
          disabled={query.isPending}
        >
          <SelectTrigger
            className="h-9 w-full text-sm"
            data-testid="milestone-assignee"
          >
            <SelectValue placeholder="Awaiting a coach" />
          </SelectTrigger>
          <SelectContent className="z-[80]">
            <SelectItem value="__none">
              <span className="text-amber-token">Awaiting a coach</span>
            </SelectItem>
            {options.map(p => (
              <SelectItem key={p.user_id} value={p.user_id}>
                {p.name}
                {p.is_default && (
                  <span className="ml-1.5 text-xs text-ink-3">
                    · group’s coach
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

/**
 * One line under the fields: where the dates come from and who chose the
 * holder, each with its way back to the automation.
 */
export function MilestoneProvenance({
  commitment,
  readOnly,
}: {
  commitment: Commitment
  readOnly: boolean
}) {
  const m = milestoneOf(commitment)
  const follow = useFollowMilestone()
  if (!m || !commitment.sandbox_id) return null
  const sandboxId = commitment.sandbox_id
  const closed =
    commitment.status === 'completed' || commitment.status === 'abandoned'
  const go = (body: { dates?: boolean; assignee?: boolean }) =>
    follow.mutate({ sandboxId, milestoneId: m.id, body })
  const link =
    'font-medium text-ds-accent underline-offset-4 hover:underline disabled:opacity-50'
  return (
    <div
      className="space-y-1 text-xs text-ink-3"
      data-testid="milestone-provenance"
    >
      <p data-testid="milestone-follows">
        {followsText(m)}
        {!m.follows && !readOnly && !closed && (
          <>
            {' · '}
            <button
              type="button"
              className={link}
              disabled={follow.isPending}
              onClick={() => go({ dates: true })}
              data-testid="milestone-use-default"
            >
              Use default dates
            </button>
          </>
        )}
      </p>
      {m.assignee_pinned && (
        <p data-testid="milestone-pinned">
          Chosen by hand
          {!readOnly && !closed && (
            <>
              {' · '}
              <button
                type="button"
                className={link}
                disabled={follow.isPending}
                onClick={() => go({ assignee: true })}
                data-testid="milestone-follow-coach"
              >
                Follow the group’s coach
              </button>
            </>
          )}
        </p>
      )}
      {m.coach_pending && (
        <p className="text-amber-token" data-testid="milestone-awaiting">
          Awaiting a coach — nobody is nudged until someone holds it.
        </p>
      )}
      {m.sealed && (
        <p data-testid="milestone-sealed-note">
          Completed because an outcome is sealed.
        </p>
      )}
    </div>
  )
}

/** Dismiss with an optional reason — a person's choice the automation never undoes. */
export function DismissMilestoneDialog({
  open,
  onOpenChange,
  commitment,
  onFieldsUpdate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  commitment: Commitment
  onFieldsUpdate: FieldsPatch
}) {
  const [reason, setReason] = useState('')
  useEffect(() => {
    if (open) setReason('')
  }, [open])
  const dismiss = () => {
    const why = reason.trim()
    onFieldsUpdate(
      why ? { status: 'abandoned', reason: why } : { status: 'abandoned' },
      { status: 'abandoned' },
    )
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[90] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dismiss this milestone?</DialogTitle>
          <DialogDescription>
            It stops being tracked for{' '}
            {commitment.milestone?.member_name ?? 'this person'}. The automation
            will not bring it back; you can restore it from the menu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="milestone-dismiss-reason">
            Why? <span className="font-normal text-ink-3">(optional)</span>
          </Label>
          <Textarea
            id="milestone-dismiss-reason"
            rows={2}
            maxLength={500}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="They are not taking part in the midpoint report."
            data-testid="milestone-dismiss-reason"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={dismiss} data-testid="milestone-dismiss-confirm">
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
