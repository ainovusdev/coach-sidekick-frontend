'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, Check, ArrowRight, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useClientPreSession } from '@/hooks/queries/use-questionnaire'
import { useSubmitClientPreSession } from '@/hooks/mutations/use-questionnaire-mutations'

/**
 * Prominent pre-session prep card for the client portal dashboard.
 *
 * Surfaces the same 5 prep questions that are sent by email — answers here write
 * to the same response and notify the coach. Rendered as a standalone, tinted
 * card below the next-session hero. Hidden entirely when there is no upcoming
 * session to prep for.
 */
export function PreSessionPrep() {
  const { data } = useClientPreSession()
  const submit = useSubmitClientPreSession()

  const [open, setOpen] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const session = data?.session ?? null
  const status = data?.status ?? 'not_started'

  // Seed the form from any answers the client already saved (via portal or
  // email) each time the dialog opens.
  useEffect(() => {
    if (open && data) {
      const seeded: Record<number, string> = {}
      for (const a of data.existing_answers) {
        seeded[a.question_index] = a.answer
      }
      setAnswers(seeded)
    }
  }, [open, data])

  if (!session) return null

  const questions = [...(data?.questions ?? [])].sort(
    (a, b) => a.index - b.index,
  )
  const total = questions.length
  const answeredCount = (data?.existing_answers ?? []).filter(
    a => (a.answer ?? '').trim().length > 0,
  ).length

  const completed = status === 'completed'
  const inProgress = status === 'in_progress'

  const ctaLabel = completed
    ? 'Edit answers'
    : inProgress
      ? 'Continue'
      : 'Answer questions'

  const handleSave = async () => {
    await submit.mutateAsync({
      sessionId: session.id,
      answers: questions.map(q => ({
        question_index: q.index,
        answer: (answers[q.index] ?? '').trim(),
      })),
    })
    setOpen(false)
  }

  return (
    <>
      <div
        className={cn(
          'mb-6 rounded-[10px] border p-5 sm:p-6',
          completed
            ? 'border-forest/20 bg-forest-bg'
            : 'border-indigo/20 bg-indigo-bg',
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                completed
                  ? 'bg-forest/10 text-forest'
                  : 'bg-indigo/10 text-indigo',
              )}
            >
              {completed ? (
                <Check className="h-5 w-5" />
              ) : (
                <ClipboardList className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <h3 className="m-0 text-[15px] font-semibold tracking-tight text-ink">
                {completed
                  ? "You're prepped for your session"
                  : 'Prepare for your session'}
              </h3>
              <p className="m-0 mt-1 text-[13px] text-ink-2">
                {completed
                  ? 'Your answers are with your coach. You can still edit them before the session.'
                  : inProgress
                    ? `${answeredCount} of ${total} answered — finish so your coach can prepare.`
                    : `${total} quick questions so your coach can make the most of your time.`}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setOpen(true)}
            variant={completed ? 'outline' : 'default'}
            className="shrink-0 self-start sm:self-auto"
          >
            {ctaLabel}
            {!completed && <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Prepare for your next session</DialogTitle>
            <DialogDescription>
              Your answers go straight to your coach to help them prepare. You
              can update them anytime before the session.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {questions.map((q, i) => (
              <div key={q.index} className="space-y-2">
                <label className="block text-[13px] font-medium text-ink">
                  {i + 1}. {q.text}
                </label>
                <Textarea
                  value={answers[q.index] ?? ''}
                  onChange={e =>
                    setAnswers(prev => ({ ...prev, [q.index]: e.target.value }))
                  }
                  placeholder="Type your answer…"
                  className="min-h-[90px]"
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submit.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submit.isPending}>
              {submit.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Save answers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
