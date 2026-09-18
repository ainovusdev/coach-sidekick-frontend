'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateOutcome,
  useProposeOutcome,
  useUpdateOutcome,
} from '@/hooks/mutations/use-outcome-mutations'
import { listNames } from '@/lib/sandbox/format'
import type { Outcome } from '@/types/sandbox-outcomes'

/**
 * Draft or edit one outcome. "Propose" saves and sends it to the approver in
 * one go — that is the path most people take; "Save draft" keeps it private
 * to the coach and coachee until it reads right.
 */
export function OutcomeDialog({
  open,
  onOpenChange,
  sandboxId,
  memberId,
  coacheeName,
  approverNames,
  outcome,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sandboxId: string
  memberId: string
  coacheeName: string
  approverNames: string[]
  /** Editing an existing outcome; null → creating. */
  outcome?: Outcome | null
}) {
  const create = useCreateOutcome(sandboxId)
  const update = useUpdateOutcome(sandboxId)
  const propose = useProposeOutcome(sandboxId)
  const [title, setTitle] = useState('')
  const [measure, setMeasure] = useState('')

  useEffect(() => {
    if (open) {
      setTitle(outcome?.title ?? '')
      setMeasure(outcome?.measure ?? '')
    }
  }, [open, outcome])

  const pending = create.isPending || update.isPending || propose.isPending
  const ready = title.trim().length > 0
  const editing = !!outcome
  const canProposeFromHere = !outcome || outcome.status !== 'proposed'
  const approverLine =
    approverNames.length > 0
      ? `Goes to ${listNames(approverNames, 2)} for the gold seal.`
      : 'No approver yet — a supervisor on the group, or the primary client, gives the gold seal.'

  const save = async (andPropose: boolean) => {
    if (!ready) return
    const data = { title: title.trim(), measure: measure.trim() || null }
    if (outcome) {
      await update.mutateAsync({ outcomeId: outcome.id, data })
      if (andPropose) await propose.mutateAsync(outcome.id)
    } else {
      await create.mutateAsync({
        member_id: memberId,
        propose: andPropose,
        ...data,
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="outcome-dialog">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit outcome' : `An outcome for ${coacheeName}`}
          </DialogTitle>
          <DialogDescription>
            Measurable, specific, thrilling. One or two per coachee; once gold
            sealed they are the benchmarks for this contract.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="outcome-title">The outcome</Label>
            <Input
              id="outcome-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={255}
              placeholder="Lead the Q4 launch without a single escalation"
              autoFocus
              data-testid="outcome-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outcome-measure">How we’ll know</Label>
            <Textarea
              id="outcome-measure"
              value={measure}
              onChange={e => setMeasure(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="What will be true, by when? “Launch shipped by 15 Nov, zero escalations to the VP.”"
              data-testid="outcome-measure"
            />
          </div>
          <p className="text-xs text-ink-3">{approverLine}</p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={canProposeFromHere ? 'outline' : 'default'}
            disabled={!ready || pending}
            onClick={() => save(false)}
            data-testid="outcome-save"
          >
            {editing ? 'Save' : 'Save draft'}
          </Button>
          {canProposeFromHere && (
            <Button
              disabled={!ready || pending}
              onClick={() => save(true)}
              data-testid="outcome-propose"
            >
              {pending
                ? 'Saving…'
                : editing
                  ? 'Save and propose'
                  : 'Propose for gold seal'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
