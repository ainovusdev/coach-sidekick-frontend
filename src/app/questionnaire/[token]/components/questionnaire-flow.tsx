'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { QuestionnaireService } from '@/services/questionnaire-service'
import type {
  QuestionItem,
  QuestionnaireAnswerItem,
} from '@/types/questionnaire'

interface QuestionnaireFlowProps {
  token: string
  questions: QuestionItem[]
  existingAnswers: QuestionnaireAnswerItem[]
  clientName: string
  coachName: string
  onComplete: () => void
}

function getStorageKey(token: string) {
  return `questionnaire_answers_${token}`
}

function loadFromStorage(token: string): Record<number, string> {
  try {
    const raw = localStorage.getItem(getStorageKey(token))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(token: string, answers: Record<number, string>) {
  try {
    localStorage.setItem(getStorageKey(token), JSON.stringify(answers))
  } catch {
    // Storage full or unavailable — continue without persistence
  }
}

function clearStorage(token: string) {
  try {
    localStorage.removeItem(getStorageKey(token))
  } catch {
    // Ignore
  }
}

export function QuestionnaireFlow({
  token,
  questions,
  existingAnswers,
  onComplete,
}: QuestionnaireFlowProps) {
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    // Priority: localStorage > existingAnswers from API
    const stored = loadFromStorage(token)
    if (Object.keys(stored).length > 0) return stored

    const initial: Record<number, string> = {}
    existingAnswers.forEach(a => {
      initial[a.question_index] = a.answer
    })
    return initial
  })
  const [currentIndex, setCurrentIndex] = useState(() => {
    // Resume at the first unanswered question
    const stored = loadFromStorage(token)
    const answeredKeys =
      Object.keys(stored).length > 0
        ? stored
        : existingAnswers.reduce<Record<number, string>>((acc, a) => {
            acc[a.question_index] = a.answer
            return acc
          }, {})

    for (let i = 0; i < questions.length; i++) {
      if (!answeredKeys[i] || !String(answeredKeys[i]).trim()) return i
    }
    // All answered — go to last question so user can review/submit
    return Object.keys(answeredKeys).length > 0 ? questions.length - 1 : 0
  })
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentQuestion = questions[currentIndex]
  const currentAnswer = answers[currentIndex] || ''
  const isFirst = currentIndex === 0
  const isLast = currentIndex === questions.length - 1
  const progress = ((currentIndex + 1) / questions.length) * 100

  // Auto-focus textarea
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus()
    }, 400)
    return () => clearTimeout(timer)
  }, [currentIndex])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`
    }
  }, [currentAnswer])

  const updateAnswer = (value: string) => {
    const updated = { ...answers, [currentIndex]: value }
    setAnswers(updated)
    saveToStorage(token, updated)
  }

  const goNext = async () => {
    if (isAnimating) return

    if (isLast) {
      // Submit all answers in one API call
      setIsSubmitting(true)
      try {
        const allAnswers = questions
          .map(q => ({
            question_index: q.index,
            answer: (answers[q.index] || '').trim(),
          }))
          .filter(a => a.answer.length > 0)

        await QuestionnaireService.submitAll(token, allAnswers)
        clearStorage(token)
        onComplete()
      } catch {
        toast.error('Failed to submit. Please try again.')
        setIsSubmitting(false)
      }
      return
    }

    // Instant navigation — no API call
    setDirection('forward')
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setIsAnimating(false)
    }, 300)
  }

  const goBack = () => {
    if (isFirst || isAnimating) return

    setDirection('backward')
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentIndex(prev => prev - 1)
      setIsAnimating(false)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      goNext()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-100">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gray-900 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Header with Novus Logo */}
      <div className="pt-8 px-6 flex flex-col items-center gap-3">
        <Image
          src="/novus-global-logo.webp"
          alt="Novus Global"
          width={120}
          height={40}
          className="opacity-80"
          priority
        />
        <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">
          Pre-Session Questionnaire
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Question (counter + text + input all animate together) */}
          <div
            className={`transition-all duration-300 ease-out ${
              isAnimating
                ? direction === 'forward'
                  ? '-translate-y-4 opacity-0'
                  : 'translate-y-4 opacity-0'
                : 'translate-y-0 opacity-100'
            }`}
          >
            {/* Question Counter */}
            <div className="mb-8">
              <span className="text-sm text-gray-400 font-medium">
                {currentIndex + 1}{' '}
                <span className="text-gray-300">/ {questions.length}</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-light text-gray-900 leading-relaxed mb-8">
              {currentQuestion?.text}
            </h2>

            {/* Answer Input */}
            <textarea
              ref={textareaRef}
              value={currentAnswer}
              onChange={e => updateAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              placeholder="Type your answer here..."
              className="w-full bg-transparent border-0 border-b-2 border-gray-200 focus:border-gray-900 text-lg text-gray-800 placeholder-gray-300 resize-none outline-none pb-3 transition-colors duration-200 min-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12">
            <button
              onClick={goBack}
              disabled={isFirst || isAnimating}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isFirst
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              onClick={goNext}
              disabled={!currentAnswer.trim() || isAnimating || isSubmitting}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all ${
                currentAnswer.trim()
                  ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span
                className={isSubmitting ? 'flex items-center gap-2' : 'hidden'}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </span>
              <span
                className={
                  !isSubmitting && isLast ? 'flex items-center gap-2' : 'hidden'
                }
              >
                Complete
                <Check className="h-4 w-4" />
              </span>
              <span
                className={
                  !isSubmitting && !isLast
                    ? 'flex items-center gap-2'
                    : 'hidden'
                }
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-xs text-gray-300 mt-8">
            Press{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-400 font-mono">
              ⌘
            </kbd>{' '}
            +{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-400 font-mono">
              Enter
            </kbd>{' '}
            to continue
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 text-center">
        <p className="text-xs text-gray-300">Powered by Novus Global</p>
      </div>
    </div>
  )
}
