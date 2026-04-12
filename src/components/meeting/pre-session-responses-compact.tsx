'use client'

import { useState } from 'react'
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
} from 'lucide-react'
import { useQuestionnaireResponses } from '@/hooks/queries/use-questionnaire'
import { useSendQuestionnaire } from '@/hooks/mutations/use-questionnaire-mutations'

interface PreSessionResponsesCompactProps {
  sessionId: string | undefined
  clientId: string | undefined
}

export function PreSessionResponsesCompact({
  sessionId,
  clientId,
}: PreSessionResponsesCompactProps) {
  const { data: responses, isLoading } = useQuestionnaireResponses(
    sessionId,
    clientId,
  )
  const sendQuestionnaire = useSendQuestionnaire()
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="animate-pulse space-y-1.5">
            <div className="h-2.5 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
            <div className="h-2.5 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (!responses || responses.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3">
          <ClipboardList className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          No pre-session responses for this session
        </p>
        {sessionId && clientId && (
          <button
            onClick={() =>
              sendQuestionnaire.mutate({
                sessionId,
                clientId,
              })
            }
            disabled={sendQuestionnaire.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {sendQuestionnaire.isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-3 w-3" />
                Send Questionnaire
              </>
            )}
          </button>
        )}
      </div>
    )
  }

  const response = responses[0]

  return (
    <div className="p-3 space-y-2.5 overflow-y-auto h-full">
      {response.responses.map((qa, idx) => {
        const isExpanded = expandedIndex === idx
        const isLong = qa.answer.length > 120
        const displayAnswer =
          isLong && !isExpanded ? qa.answer.slice(0, 120) + '...' : qa.answer

        // Shorten question for compact display
        const shortQuestion =
          qa.question_text.length > 60
            ? qa.question_text.slice(0, 60) + '...'
            : qa.question_text

        return (
          <div
            key={idx}
            className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
              {shortQuestion}
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              {displayAnswer}
            </p>
            {isLong && (
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-600 mt-1 transition-colors"
              >
                {isExpanded ? (
                  <>
                    Show less <ChevronUp className="h-2.5 w-2.5" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="h-2.5 w-2.5" />
                  </>
                )}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
