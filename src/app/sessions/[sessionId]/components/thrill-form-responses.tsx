'use client'

import { Sparkles, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useThrillFormResponses } from '@/hooks/queries/use-questionnaire'
import { format } from 'date-fns'

interface ThrillFormResponsesProps {
  sessionId: string
  clientId?: string
}

function formatAnswer(questionText: string, answer: string) {
  // Scale questions originate as a single 1–10 number string. Show "8 / 10"
  // so the rating is unmistakable in the coach view.
  const trimmed = answer.trim()
  if (/^([1-9]|10)$/.test(trimmed)) {
    return `${trimmed} / 10`
  }
  // Yes / no — render as a small badge inline.
  if (trimmed.toLowerCase() === 'yes' || trimmed.toLowerCase() === 'no') {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
  }
  return answer
}

function isShortAnswer(answer: string) {
  const trimmed = answer.trim()
  return (
    /^([1-9]|10)$/.test(trimmed) ||
    trimmed.toLowerCase() === 'yes' ||
    trimmed.toLowerCase() === 'no'
  )
}

export function ThrillFormResponses({
  sessionId,
  clientId,
}: ThrillFormResponsesProps) {
  const { data: responses, isLoading } = useThrillFormResponses(
    sessionId,
    clientId,
  )

  if (isLoading || !responses || responses.length === 0) return null

  const response = responses[0]
  const isCompleted = response.status === 'completed'

  return (
    <Card className="border-app-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-app-secondary" />
            <h3 className="text-sm font-semibold text-app-primary">
              Thrill Form
            </h3>
          </div>
          {isCompleted ? (
            <Badge
              variant="secondary"
              className="bg-forest-bg text-forest border-forest text-xs"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
              {response.completed_at &&
                ` ${format(new Date(response.completed_at), 'MMM d')}`}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-amber-token-bg text-amber-token border-amber-token text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              In Progress
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {response.responses.map((qa, idx) => {
            const formatted = formatAnswer(qa.question_text, qa.answer)
            const compact = isShortAnswer(qa.answer)
            return (
              <div key={idx}>
                <p className="text-xs font-medium text-app-secondary uppercase tracking-wider mb-1.5">
                  {qa.question_text}
                </p>
                {compact ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-semibold bg-surface-3 text-app-primary">
                    {formatted}
                  </span>
                ) : (
                  <p className="text-sm text-app-primary leading-relaxed">
                    {formatted}
                  </p>
                )}
                {idx < response.responses.length - 1 && (
                  <div className="border-b border-app-border mt-4" />
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
