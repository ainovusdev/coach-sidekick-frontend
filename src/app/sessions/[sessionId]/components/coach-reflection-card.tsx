'use client'

import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  NotebookPen,
  Send,
  Trophy,
} from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCoachReflection } from '@/hooks/queries/use-questionnaire'
import { useSendCoachReflection } from '@/hooks/mutations/use-questionnaire-mutations'
import { useFeatureFlagEnabled } from '@/hooks/use-feature-flag'
import type { CoachReflectionAnswer } from '@/types/questionnaire'

/**
 * The coach's half of the post-session pair, beside the coachee's Thrill Form.
 * Only a session that credits a sandbox has one; every other session renders
 * nothing and, with the flag off, asks nothing.
 */
export function CoachReflectionCard({ sessionId }: { sessionId: string }) {
  const enabled = useFeatureFlagEnabled('sandboxes')
  const { data, isLoading } = useCoachReflection(sessionId, enabled)
  const send = useSendCoachReflection()

  if (!enabled || isLoading || !data || !data.applicable) return null

  const completed = data.status === 'completed'

  return (
    <Card
      className="border-app-border shadow-sm"
      data-testid="coach-reflection-card"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-app-secondary" />
            <h3 className="text-sm font-semibold text-app-primary">
              Coach Reflection
            </h3>
          </div>
          {completed ? (
            <Badge
              variant="secondary"
              className="bg-forest-bg text-forest border-forest text-xs"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
              {data.completed_at &&
                ` ${format(new Date(data.completed_at), 'MMM d')}`}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-amber-token-bg text-amber-token border-amber-token text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              Yours to fill in
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {completed ? (
          <ReflectionAnswers answers={data.responses} wins={data.wins} />
        ) : (
          <>
            <p className="text-sm text-app-secondary leading-relaxed">
              Two minutes while the call is fresh: on track or off, rapport,
              what you noticed, and any wins. Shared with the account executive
              and lead coach on this programme — never with your coachee or
              their organisation.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {data.fill_url && (
                <Button size="sm" asChild data-testid="coach-reflection-fill">
                  <a href={data.fill_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Fill in reflection
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={send.isPending}
                onClick={() => send.mutate(sessionId)}
              >
                {send.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                )}
                {data.status === 'not_sent'
                  ? 'Email me the form'
                  : 'Email it again'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/** Per-coachee answers first (on track, rapport), then what was asked once. */
function ReflectionAnswers({
  answers,
  wins,
}: {
  answers: Pick<
    CoachReflectionAnswer,
    'key' | 'question_text' | 'answer' | 'subject_name'
  >[]
  wins: string[]
}) {
  const subjects = Array.from(
    new Set(answers.map(a => a.subject_name).filter(Boolean)),
  ) as string[]
  const general = answers.filter(
    a => !a.subject_name && String(a.answer).trim(),
  )

  return (
    <div className="space-y-4">
      {subjects.length > 0 && (
        <ul className="space-y-2">
          {subjects.map(name => {
            const mine = answers.filter(a => a.subject_name === name)
            const track = mine.find(a => a.key === 'on_track')?.answer
            const rapport = mine.find(a => a.key === 'rapport')?.answer
            return (
              <li
                key={name}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
              >
                <span className="min-w-0 font-medium text-app-primary">
                  {name}
                </span>
                {track && (
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                      track === 'Off track'
                        ? 'bg-vermillion-bg text-vermillion'
                        : 'bg-forest-bg text-forest'
                    }`}
                  >
                    {track}
                  </span>
                )}
                {rapport && (
                  <span className="text-xs text-app-secondary">
                    Rapport{' '}
                    <span className="font-semibold tabular-nums text-app-primary">
                      {rapport} / 10
                    </span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {general.map(a => (
        <div key={a.key ?? a.question_text}>
          <p className="text-xs font-medium text-app-secondary uppercase tracking-wider mb-1.5">
            {a.question_text}
          </p>
          <p className="text-sm text-app-primary leading-relaxed whitespace-pre-wrap">
            {a.key === 'next_call' &&
            !Number.isNaN(Date.parse(String(a.answer)))
              ? format(new Date(`${a.answer}T12:00:00`), 'EEE, MMM d, yyyy')
              : String(a.answer)}
          </p>
        </div>
      ))}
      {wins.length > 0 && (
        <div>
          <p className="text-xs font-medium text-app-secondary uppercase tracking-wider mb-1.5">
            Wins
          </p>
          <ul className="space-y-1">
            {wins.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-app-primary"
              >
                <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-token" />
                <span className="min-w-0">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
