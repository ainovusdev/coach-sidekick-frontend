'use client'

import { Sparkles, CheckCircle2, Clock, Send, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useThrillForm } from '@/hooks/queries/use-questionnaire'
import { useSendThrillForm } from '@/hooks/mutations/use-questionnaire-mutations'
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
  const { data, isLoading } = useThrillForm(sessionId, clientId)
  const sendThrillForm = useSendThrillForm()

  // Never sent (or no access) → render nothing, exactly as before.
  if (isLoading || !data || data.status === 'not_sent') return null

  const isCompleted = data.status === 'completed'
  // For a sent-but-not-completed form, resend needs a client id; fall back to
  // the one attached to the token if the caller didn't pass one.
  const resendClientId = clientId || data.client_id || undefined

  const header = (
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
            {data.completed_at &&
              ` ${format(new Date(data.completed_at), 'MMM d')}`}
          </Badge>
        ) : data.status === 'in_progress' ? (
          <Badge
            variant="secondary"
            className="bg-amber-token-bg text-amber-token border-amber-token text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="bg-amber-token-bg text-amber-token border-amber-token text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            Awaiting response
          </Badge>
        )}
      </div>
    </CardHeader>
  )

  // Sent, but the client hasn't opened/completed it yet — surface it (instead
  // of silently showing nothing) so the coach knows it's pending and can resend.
  if (data.status === 'sent') {
    const who = data.client_name || 'Your client'
    return (
      <Card className="border-app-border shadow-sm">
        {header}
        <CardContent className="pt-0">
          <p className="text-sm text-app-secondary leading-relaxed">
            {who} hasn&apos;t completed the Thrill Form yet
            {data.sent_at &&
              ` — sent ${format(new Date(data.sent_at), 'MMM d')}`}
            .
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={!resendClientId || sendThrillForm.isPending}
            onClick={() =>
              resendClientId &&
              sendThrillForm.mutate({ sessionId, clientId: resendClientId })
            }
          >
            {sendThrillForm.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1.5" />
            )}
            Resend Thrill Form
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Completed / in-progress → show the answers.
  return (
    <Card className="border-app-border shadow-sm">
      {header}
      <CardContent className="pt-0">
        <div className="space-y-4">
          {data.responses.map((qa, idx) => {
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
                {idx < data.responses.length - 1 && (
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
