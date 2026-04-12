'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { QuestionnaireService } from '@/services/questionnaire-service'
import type { QuestionnaireValidation } from '@/types/questionnaire'
import { QuestionnaireFlow } from './components/questionnaire-flow'
import { QuestionnaireComplete } from './components/questionnaire-complete'

type PageState = 'loading' | 'error' | 'active' | 'complete'

export default function QuestionnairePage() {
  const params = useParams()
  const token = params.token as string

  const [state, setState] = useState<PageState>('loading')
  const [data, setData] = useState<QuestionnaireValidation | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const validate = async () => {
      try {
        const result = await QuestionnaireService.validateToken(token)
        setData(result)
        setState('active')
      } catch {
        setErrorMessage(
          'This questionnaire link is invalid or has expired. Please contact your coach for a new link.',
        )
        setState('error')
      }
    }
    validate()
  }, [token])

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading questionnaire...</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-3">
            Questionnaire Unavailable
          </h1>
          <p className="text-gray-500 leading-relaxed">{errorMessage}</p>
        </div>
      </div>
    )
  }

  if (state === 'complete' && data) {
    return (
      <QuestionnaireComplete
        clientName={data.client_name}
        coachName={data.coach_name}
        scheduledFor={data.scheduled_for}
      />
    )
  }

  if (state === 'active' && data) {
    return (
      <QuestionnaireFlow
        token={token}
        questions={data.questions}
        existingAnswers={data.existing_answers}
        clientName={data.client_name}
        coachName={data.coach_name}
        onComplete={() => setState('complete')}
      />
    )
  }

  return null
}
