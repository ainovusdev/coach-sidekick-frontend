'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import {
  EVALUATION_QUESTIONS,
  averageScore,
  scoreChipClass,
  scoreLabel,
} from '@/lib/coach-evaluation-questions'
import { CoachEvaluation } from '@/services/coach-evaluations-service'
import { useDeleteCoachEvaluation } from '@/hooks/mutations/use-coach-evaluation-mutations'
import { formatRelativeTime } from '@/lib/date-utils'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface EvaluationsListProps {
  sessionId: string
  evaluations: CoachEvaluation[]
  currentUserId: string | null
  isAdmin: boolean
}

export function EvaluationsList({
  sessionId,
  evaluations,
  currentUserId,
  isAdmin,
}: EvaluationsListProps) {
  const avg = useMemo(() => averageScore(evaluations), [evaluations])

  return (
    <section className="mt-6 rounded-lg border border-app-border bg-surface-1 p-4">
      <header className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-semibold text-app-primary">
          Peer evaluations{' '}
          <span className="text-sm font-normal text-app-secondary">
            ({evaluations.length})
          </span>
        </h2>
        {avg !== null && (
          <span className="text-xs text-app-secondary">
            Avg across reviewers:{' '}
            <span className="font-semibold text-app-primary">
              {avg.toFixed(1)} / 4
            </span>
          </span>
        )}
      </header>

      {evaluations.length === 0 ? (
        <p className="text-sm text-app-secondary">No evaluations yet.</p>
      ) : (
        <ul className="space-y-2">
          {evaluations.map(e => (
            <EvaluationRow
              key={e.id}
              sessionId={sessionId}
              evaluation={e}
              isOwn={e.reviewer_id === currentUserId}
              canDelete={isAdmin || e.reviewer_id === currentUserId}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

interface EvaluationRowProps {
  sessionId: string
  evaluation: CoachEvaluation
  isOwn: boolean
  canDelete: boolean
}

function EvaluationRow({
  sessionId,
  evaluation,
  isOwn,
  canDelete,
}: EvaluationRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleteMut = useDeleteCoachEvaluation(sessionId)

  const reviewerLabel =
    evaluation.reviewer_name || evaluation.reviewer_email || 'Unknown reviewer'

  const numericScores = useMemo(() => {
    const nums: number[] = []
    for (const v of Object.values(evaluation.scores)) {
      if (typeof v === 'number') nums.push(v)
    }
    return nums
  }, [evaluation.scores])

  const reviewerAvg =
    numericScores.length === 0
      ? null
      : numericScores.reduce((a, b) => a + b, 0) / numericScores.length

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync(evaluation.id)
      setConfirmOpen(false)
    } catch {
      // toast handled by mutation
    }
  }

  return (
    <li className="rounded-md border border-app-border bg-surface-1 ">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-paper "
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 mt-0.5 text-ink-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 mt-0.5 text-ink-4 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-medium text-app-primary">
              {reviewerLabel}
            </span>
            {isOwn && (
              <span className="text-[10px] uppercase tracking-wide rounded bg-indigo-bg text-indigo px-1.5 py-0.5">
                you
              </span>
            )}
            <span className="text-xs text-app-secondary">
              {formatRelativeTime(evaluation.created_at)}
            </span>
            {reviewerAvg !== null && (
              <span className="text-xs text-app-secondary ml-auto">
                Avg{' '}
                <span className="font-semibold text-app-primary">
                  {reviewerAvg.toFixed(1)} / 4
                </span>
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {EVALUATION_QUESTIONS.map(q => {
              const v = evaluation.scores[q.id]
              return (
                <span
                  key={q.id}
                  title={`${q.id.toUpperCase()}: ${scoreLabel(v)}`}
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium',
                    scoreChipClass(v),
                  )}
                >
                  {v === null ? '—' : v}
                </span>
              )
            })}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pl-9 space-y-2 border-t border-app-border/60">
          <ol className="space-y-1.5 mt-2">
            {EVALUATION_QUESTIONS.map((q, idx) => {
              const v = evaluation.scores[q.id]
              return (
                <li key={q.id} className="flex items-start gap-2 text-xs">
                  <span className="text-app-secondary shrink-0">
                    {idx + 1}.
                  </span>
                  <span className="flex-1 text-app-primary leading-snug">
                    {q.text}
                  </span>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                      scoreChipClass(v),
                    )}
                  >
                    {scoreLabel(v)}
                  </span>
                </li>
              )
            })}
          </ol>
          {evaluation.feedback && (
            <div className="rounded bg-paper p-2 mt-2">
              <p className="text-[10px] uppercase tracking-wide text-app-secondary mb-1">
                Feedback
              </p>
              <p className="text-xs text-app-primary whitespace-pre-wrap">
                {evaluation.feedback}
              </p>
            </div>
          )}
          {canDelete && (
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-vermillion hover:bg-vermillion-bg hover:text-vermillion"
                onClick={() => setConfirmOpen(true)}
                disabled={deleteMut.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this evaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              {isOwn
                ? 'Your answers and feedback will be removed.'
                : `Remove the evaluation submitted by ${reviewerLabel}.`}{' '}
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="bg-vermillion hover:bg-vermillion focus:ring-vermillion"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}
