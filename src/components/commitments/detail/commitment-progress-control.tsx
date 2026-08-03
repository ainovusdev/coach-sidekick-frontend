'use client'

/**
 * Progress control with a milestone-derived suggestion.
 *
 * Before this, progress was only ever 0 or 100 — set as a side effect of the
 * status toggle — even though the commitment already had subtasks that imply a
 * real percentage.
 *
 * Deliberately an affordance, not an automation: `progress_percentage` is
 * written independently by several surfaces, and most commitments have no
 * milestones at all (where a derived number would be meaningless). Silently
 * overwriting a coach's manual figure on every subtask toggle would be a
 * data-loss-shaped surprise, so the rollup is offered as one click instead.
 */

import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useUpdateCommitmentProgress } from '@/hooks/mutations/use-commitment-mutations'
import { useClientUpdateCommitmentProgress } from '@/hooks/mutations/use-client-commitment-mutations'
import type { Commitment } from '@/types/commitment'

const STEPS = [0, 25, 50, 75, 100]

export function CommitmentProgressControl({
  commitment,
  commitmentId,
  clientMode,
}: {
  commitment: Commitment
  commitmentId: string
  clientMode?: boolean
}) {
  // Both called unconditionally — never make these conditional.
  const coachUpdate = useUpdateCommitmentProgress()
  const clientUpdate = useClientUpdateCommitmentProgress()
  const updateProgress = clientMode ? clientUpdate : coachUpdate

  const current = commitment.progress_percentage ?? 0
  const milestones = commitment.milestones || []
  const done = milestones.filter(m => m.status === 'completed').length
  const derived = milestones.length
    ? Math.round((done / milestones.length) * 100)
    : null

  // Writes through POST /{id}/progress rather than PATCH: that path also
  // creates the commitment_updates row the activity timeline is built from.
  const setProgress = (value: number) => {
    if (value === current) return
    updateProgress.mutate({
      commitmentId,
      data: { progress_percentage: value },
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-ink-3">Progress</label>
        <span className="text-xs font-medium text-ink-2 tabular-nums">
          {current}%
        </span>
      </div>

      <Progress value={current} className="h-1.5" />

      <div className="flex flex-wrap gap-1">
        {STEPS.map(step => (
          <button
            key={step}
            type="button"
            onClick={() => setProgress(step)}
            aria-pressed={current === step}
            className={
              'px-2 py-0.5 rounded text-[11px] font-medium border transition-colors tabular-nums ' +
              (current === step
                ? 'bg-ds-accent-bg text-ds-accent border-ds-accent'
                : 'bg-transparent text-ink-3 border-line hover:text-ink-2 hover:border-ink-4')
            }
          >
            {step}%
          </button>
        ))}
      </div>

      {derived !== null && (
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-ink-3">
            {done} of {milestones.length} subtask
            {milestones.length === 1 ? '' : 's'} done ({derived}%)
          </span>
          {derived !== current && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={() => setProgress(derived)}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Sync to {derived}%
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
