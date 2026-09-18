'use client'

import { useEffect, useState } from 'react'
import { Award } from 'lucide-react'
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
import { useDecideOutcome } from '@/hooks/mutations/use-outcome-mutations'
import type { Outcome } from '@/types/sandbox-outcomes'

export type Decision = 'seal' | 'changes'

/** The approver's moment: gold seal it, or send it back with a reason. */
export function DecisionDialog({
  outcome,
  decision,
  onOpenChange,
  sandboxId,
  coacheeName,
}: {
  outcome: Outcome | null
  decision: Decision
  onOpenChange: (open: boolean) => void
  sandboxId: string
  coacheeName: string
}) {
  const decide = useDecideOutcome(sandboxId)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (outcome) setNote('')
  }, [outcome, decision])

  if (!outcome) return null
  const sealing = decision === 'seal'
  const ready = sealing || note.trim().length > 0

  const submit = async () => {
    if (!ready) return
    await decide.mutateAsync({
      outcomeId: outcome.id,
      data: { decision, note: note.trim() || null },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={!!outcome} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="decision-dialog">
        <DialogHeader>
          <DialogTitle>
            {sealing ? 'Gold seal this outcome?' : 'Request changes'}
          </DialogTitle>
          <DialogDescription>
            {sealing
              ? `It becomes one of the benchmarks for ${coacheeName}’s coaching on this contract.`
              : `${coacheeName} and their coach will see your reason and can propose it again.`}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
          <p className="text-sm font-medium text-ink">{outcome.title}</p>
          {outcome.measure && (
            <p className="mt-0.5 text-xs text-ink-3">{outcome.measure}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="decision-note">
            {sealing ? 'A note (optional)' : 'What should change?'}
          </Label>
          <Textarea
            id="decision-note"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            maxLength={4000}
            placeholder={
              sealing
                ? 'Looking forward to this one.'
                : 'Make it measurable — how many launches, by when?'
            }
            autoFocus={!sealing}
            data-testid="decision-note"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={sealing ? 'default' : 'destructive'}
            disabled={!ready || decide.isPending}
            onClick={submit}
            data-testid="decision-confirm"
          >
            {sealing && <Award className="h-4 w-4" />}
            {decide.isPending ? 'Saving…' : sealing ? 'Gold seal' : 'Send back'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
