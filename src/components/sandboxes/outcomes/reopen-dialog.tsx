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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useReopenOutcome } from '@/hooks/mutations/use-outcome-mutations'
import type { Outcome } from '@/types/sandbox-outcomes'

/** Renegotiation: a sealed outcome goes back to "changes requested" with a reason. */
export function ReopenDialog({
  outcome,
  onOpenChange,
  sandboxId,
}: {
  outcome: Outcome | null
  onOpenChange: (open: boolean) => void
  sandboxId: string
}) {
  const reopen = useReopenOutcome(sandboxId)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (outcome) setReason('')
  }, [outcome])

  if (!outcome) return null

  const submit = async () => {
    if (!reason.trim()) return
    await reopen.mutateAsync({ outcomeId: outcome.id, reason: reason.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={!!outcome} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="reopen-dialog">
        <DialogHeader>
          <DialogTitle>Reopen “{outcome.title}”?</DialogTitle>
          <DialogDescription>
            The gold seal comes off and the outcome has to be agreed again. The
            coach, the coachee and the approver are told why.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reopen-reason">Why?</Label>
          <Textarea
            id="reopen-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            maxLength={4000}
            placeholder="The launch moved to next year — the outcome needs a new date."
            autoFocus
            data-testid="reopen-reason"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep it sealed
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || reopen.isPending}
            onClick={submit}
            data-testid="reopen-confirm"
          >
            {reopen.isPending ? 'Reopening…' : 'Reopen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
