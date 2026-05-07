'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import {
  EVALUATION_QUESTIONS,
  SCORE_OPTIONS,
  ScoreValue,
  scoreChipClass,
} from '@/lib/coach-evaluation-questions'
import { CoachEvaluation } from '@/services/coach-evaluations-service'
import {
  useCreateCoachEvaluation,
  useDeleteCoachEvaluation,
  useUpdateCoachEvaluation,
} from '@/hooks/mutations/use-coach-evaluation-mutations'
import { cn } from '@/lib/utils'

type AnswerMap = Record<string, ScoreValue | undefined>

const REVIEW_STEP = EVALUATION_QUESTIONS.length

interface CoachEvaluationDialogProps {
  sessionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  existingEvaluation?: CoachEvaluation | null
}

function buildInitialAnswers(
  existing: CoachEvaluation | null | undefined,
): AnswerMap {
  const map: AnswerMap = {}
  for (const q of EVALUATION_QUESTIONS) {
    map[q.id] =
      existing && q.id in existing.scores ? existing.scores[q.id] : undefined
  }
  return map
}

export function CoachEvaluationDialog({
  sessionId,
  open,
  onOpenChange,
  existingEvaluation,
}: CoachEvaluationDialogProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>(() =>
    buildInitialAnswers(existingEvaluation),
  )
  const [feedback, setFeedback] = useState<string>(
    existingEvaluation?.feedback ?? '',
  )
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const createMut = useCreateCoachEvaluation(sessionId)
  const updateMut = useUpdateCoachEvaluation(sessionId)
  const deleteMut = useDeleteCoachEvaluation(sessionId)

  const isEditing = !!existingEvaluation
  const isPending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending

  // Reset state whenever the dialog opens or the underlying record changes.
  useEffect(() => {
    if (open) {
      setStep(0)
      setAnswers(buildInitialAnswers(existingEvaluation))
      setFeedback(existingEvaluation?.feedback ?? '')
    }
  }, [open, existingEvaluation])

  // Cancel any pending auto-advance when the modal closes.
  useEffect(() => {
    if (!open && advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }, [open])

  const answeredCount = useMemo(
    () => EVALUATION_QUESTIONS.filter(q => answers[q.id] !== undefined).length,
    [answers],
  )
  const allAnswered = answeredCount === EVALUATION_QUESTIONS.length

  const onReview = step === REVIEW_STEP
  const currentQuestion = !onReview ? EVALUATION_QUESTIONS[step] : null

  const handleSelect = useCallback(
    (value: ScoreValue) => {
      if (!currentQuestion) return
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
      // Auto-advance after a brief moment so the user sees the selection
      // register before the screen changes.
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = setTimeout(() => {
        setStep(s => Math.min(s + 1, REVIEW_STEP))
      }, 180)
    },
    [currentQuestion],
  )

  const goBack = () => setStep(s => Math.max(s - 1, 0))
  const goNext = () => setStep(s => Math.min(s + 1, REVIEW_STEP))

  // Keyboard shortcuts on question steps: 1–4 for scores, N/0 for Not Observed,
  // arrow keys to navigate. Disabled when typing into the textarea on review.
  useEffect(() => {
    if (!open || onReview || !currentQuestion) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      ) {
        return
      }
      if (e.key === '1') handleSelect(1)
      else if (e.key === '2') handleSelect(2)
      else if (e.key === '3') handleSelect(3)
      else if (e.key === '4') handleSelect(4)
      else if (e.key === '0' || e.key === 'n' || e.key === 'N')
        handleSelect(null)
      else if (e.key === 'ArrowLeft') goBack()
      else if (e.key === 'ArrowRight') {
        if (answers[currentQuestion.id] !== undefined) goNext()
      } else {
        return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onReview, currentQuestion, answers, handleSelect])

  const handleSubmit = async () => {
    if (!allAnswered) return
    const scores: Record<string, number | null> = {}
    for (const q of EVALUATION_QUESTIONS) {
      const v = answers[q.id]
      scores[q.id] = v === undefined ? null : v
    }
    const trimmedFeedback = feedback.trim() || null

    try {
      if (existingEvaluation) {
        await updateMut.mutateAsync({
          evaluationId: existingEvaluation.id,
          payload: { scores, feedback: trimmedFeedback },
        })
      } else {
        await createMut.mutateAsync({ scores, feedback: trimmedFeedback })
      }
      onOpenChange(false)
    } catch {
      // Error toast handled by mutation hook.
    }
  }

  const handleDelete = async () => {
    if (!existingEvaluation) return
    try {
      await deleteMut.mutateAsync(existingEvaluation.id)
      setConfirmDeleteOpen(false)
      onOpenChange(false)
    } catch {
      // Error toast handled by mutation hook.
    }
  }

  const titleText = onReview
    ? isEditing
      ? 'Review your changes'
      : 'Review and submit'
    : isEditing
      ? 'Edit your evaluation'
      : 'Evaluate this session'

  const descriptionText = onReview
    ? `${answeredCount} of ${EVALUATION_QUESTIONS.length} answered. Add optional feedback and submit.`
    : `Question ${step + 1} of ${EVALUATION_QUESTIONS.length} · scale 1–4 (4 = demonstrates with proficiency)`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        {/* Progress bar — clickable to jump to any question. */}
        <ol className="flex items-center gap-1.5 px-1">
          {EVALUATION_QUESTIONS.map((q, i) => {
            const answered = answers[q.id] !== undefined
            const active = !onReview && i === step
            return (
              <li key={q.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`Go to question ${i + 1}`}
                  className={cn(
                    'block w-full h-1.5 rounded-full transition',
                    active
                      ? 'bg-indigo-500'
                      : answered
                        ? 'bg-indigo-300 hover:bg-indigo-400'
                        : 'bg-gray-200 hover:bg-gray-300',
                  )}
                />
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={() => allAnswered && setStep(REVIEW_STEP)}
              disabled={!allAnswered}
              aria-label="Review and submit"
              className={cn(
                'block h-1.5 w-6 rounded-full transition',
                onReview
                  ? 'bg-indigo-500'
                  : allAnswered
                    ? 'bg-indigo-300 hover:bg-indigo-400'
                    : 'bg-gray-100',
              )}
            />
          </li>
        </ol>

        {/* Body */}
        {currentQuestion && (
          <div className="flex flex-col items-center justify-center text-center px-2 py-8 min-h-[280px]">
            <p className="text-base sm:text-lg text-app-primary leading-snug max-w-xl">
              {currentQuestion.text}
            </p>
            <div className="mt-7 grid grid-cols-5 gap-2 w-full max-w-md">
              {SCORE_OPTIONS.map(opt => {
                const isSelected = answers[currentQuestion.id] === opt.value
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    disabled={isPending}
                    className={cn(
                      'h-12 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400',
                      'flex flex-col items-center justify-center px-1',
                      isSelected ? opt.selectedClass : opt.unselectedClass,
                    )}
                  >
                    <span className="leading-none">{opt.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-5 text-xs text-app-secondary">
              Press{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-app-border bg-gray-50 dark:bg-gray-800 text-[10px] font-mono">
                1
              </kbd>
              –
              <kbd className="px-1.5 py-0.5 rounded border border-app-border bg-gray-50 dark:bg-gray-800 text-[10px] font-mono">
                4
              </kbd>{' '}
              ·{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-app-border bg-gray-50 dark:bg-gray-800 text-[10px] font-mono">
                N
              </kbd>{' '}
              for Not Observed ·{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-app-border bg-gray-50 dark:bg-gray-800 text-[10px] font-mono">
                ←
              </kbd>
              /
              <kbd className="px-1.5 py-0.5 rounded border border-app-border bg-gray-50 dark:bg-gray-800 text-[10px] font-mono">
                →
              </kbd>{' '}
              to navigate
            </p>
          </div>
        )}

        {onReview && (
          <div className="px-1 py-4 space-y-5 min-h-[280px]">
            <div>
              <p className="text-[11px] uppercase tracking-wide font-medium text-app-secondary mb-2">
                Your answers — click any to revise
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {EVALUATION_QUESTIONS.map((q, i) => {
                  const v = answers[q.id]
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setStep(i)}
                      title={q.text}
                      className="flex items-center gap-2 rounded-md border border-app-border px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <span className="text-[10px] font-medium text-app-secondary shrink-0">
                        Q{i + 1}
                      </span>
                      <span
                        className={cn(
                          'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ml-auto',
                          scoreChipClass(v),
                        )}
                      >
                        {v === null ? '—' : (v ?? '?')}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label
                htmlFor="evaluation-feedback"
                className="text-sm font-medium text-app-primary"
              >
                Feedback{' '}
                <span className="text-xs font-normal text-app-secondary">
                  (optional)
                </span>
              </label>
              <Textarea
                id="evaluation-feedback"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Please share your occurrences."
                maxLength={4000}
                rows={3}
                className="mt-1.5"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-row sm:justify-between gap-2 mt-2">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={step === 0 || isPending}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            {onReview ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!allAnswered || isPending}
              >
                {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {isEditing ? 'Save changes' : 'Submit evaluation'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={goNext}
                disabled={
                  !currentQuestion ||
                  answers[currentQuestion.id] === undefined ||
                  isPending
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this evaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              Your answers and feedback will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
