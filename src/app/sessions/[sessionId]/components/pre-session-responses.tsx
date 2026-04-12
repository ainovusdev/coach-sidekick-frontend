'use client'

import { ClipboardList, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuestionnaireResponses } from '@/hooks/queries/use-questionnaire'
import { format } from 'date-fns'

interface PreSessionResponsesProps {
  sessionId: string
  clientId?: string
}

export function PreSessionResponses({
  sessionId,
  clientId,
}: PreSessionResponsesProps) {
  const { data: responses, isLoading } = useQuestionnaireResponses(
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
            <ClipboardList className="h-4 w-4 text-app-secondary" />
            <h3 className="text-sm font-semibold text-app-primary">
              Pre-Session Questionnaire
            </h3>
          </div>
          {isCompleted ? (
            <Badge
              variant="secondary"
              className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
              {response.completed_at &&
                ` ${format(new Date(response.completed_at), 'MMM d')}`}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              In Progress
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {response.responses.map((qa, idx) => (
            <div key={idx}>
              <p className="text-xs font-medium text-app-secondary uppercase tracking-wider mb-1.5">
                {qa.question_text}
              </p>
              <p className="text-sm text-app-primary leading-relaxed pl-0">
                {qa.answer}
              </p>
              {idx < response.responses.length - 1 && (
                <div className="border-b border-app-border mt-4" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
