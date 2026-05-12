'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { QuestionnaireService } from '@/services/questionnaire-service'
import type {
  QuestionItem,
  QuestionnaireAnswerItem,
  QuestionnaireKind,
} from '@/types/questionnaire'

interface QuestionnaireFlowProps {
  token: string
  questions: QuestionItem[]
  existingAnswers: QuestionnaireAnswerItem[]
  clientName: string
  coachName: string
  kind?: QuestionnaireKind
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

function isQuestionVisible(
  question: QuestionItem,
  answers: Record<number, string>,
): boolean {
  const cond = question.condition
  if (!cond) return true
  const dep = answers[cond.depends_on]
  if (dep === undefined || dep === null || dep === '') {
    // Hide conditional questions until the controlling answer exists.
    return false
  }
  if (cond.show_if !== undefined && cond.show_if !== null) {
    return (
      String(dep).trim().toLowerCase() === String(cond.show_if).toLowerCase()
    )
  }
  if (cond.show_if_not !== undefined && cond.show_if_not !== null) {
    return (
      String(dep).trim().toLowerCase() !==
      String(cond.show_if_not).toLowerCase()
    )
  }
  return true
}

export function QuestionnaireFlow({
  token,
  questions,
  existingAnswers,
  kind = 'pre_session',
  onComplete,
}: QuestionnaireFlowProps) {
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const stored = loadFromStorage(token)
    if (Object.keys(stored).length > 0) return stored

    const initial: Record<number, string> = {}
    existingAnswers.forEach(a => {
      initial[a.question_index] = a.answer
    })
    return initial
  })

  // Visible questions update as answers change (conditional skipping).
  const visibleQuestions = useMemo(
    () => questions.filter(q => isQuestionVisible(q, answers)),
    [questions, answers],
  )

  const [position, setPosition] = useState(() => {
    // Resume at the first unanswered visible question.
    const stored = loadFromStorage(token)
    const seed =
      Object.keys(stored).length > 0
        ? stored
        : existingAnswers.reduce<Record<number, string>>((acc, a) => {
            acc[a.question_index] = a.answer
            return acc
          }, {})

    const visible = questions.filter(q => isQuestionVisible(q, seed))
    for (let i = 0; i < visible.length; i++) {
      const ans = seed[visible[i].index]
      const empty = !ans || !String(ans).trim()
      if (empty && !visible[i].optional) return i
    }
    return Math.max(visible.length - 1, 0)
  })

  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Clamp position when conditional skipping changes the visible list length.
  useEffect(() => {
    if (position > visibleQuestions.length - 1) {
      setPosition(Math.max(visibleQuestions.length - 1, 0))
    }
  }, [visibleQuestions.length, position])

  const currentQuestion = visibleQuestions[position]
  const currentAnswer = currentQuestion
    ? answers[currentQuestion.index] || ''
    : ''
  const isFirst = position === 0
  const isLast = position === visibleQuestions.length - 1
  const progress =
    visibleQuestions.length > 0
      ? ((position + 1) / visibleQuestions.length) * 100
      : 0

  // Auto-focus textarea (only relevant for text questions).
  useEffect(() => {
    if (
      currentQuestion?.type !== 'scale' &&
      currentQuestion?.type !== 'yes_no'
    ) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [position, currentQuestion?.type])

  // Auto-resize textarea.
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`
    }
  }, [currentAnswer])

  const updateAnswer = (value: string) => {
    if (!currentQuestion) return
    const updated = { ...answers, [currentQuestion.index]: value }
    setAnswers(updated)
    saveToStorage(token, updated)
  }

  const canAdvance = (() => {
    if (!currentQuestion) return false
    if (currentQuestion.optional) return true
    return currentAnswer.trim().length > 0
  })()

  const goNext = async () => {
    if (isAnimating || !currentQuestion) return

    if (isLast) {
      setIsSubmitting(true)
      try {
        // Only submit answers for currently-visible questions; conditional
        // branches that the user routed around shouldn't carry stale text.
        const visibleIndexes = new Set(visibleQuestions.map(q => q.index))
        const allAnswers = questions
          .filter(q => visibleIndexes.has(q.index))
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

    setDirection('forward')
    setIsAnimating(true)
    setTimeout(() => {
      setPosition(prev => prev + 1)
      setIsAnimating(false)
    }, 300)
  }

  const goBack = () => {
    if (isFirst || isAnimating) return

    setDirection('backward')
    setIsAnimating(true)
    setTimeout(() => {
      setPosition(prev => prev - 1)
      setIsAnimating(false)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      goNext()
    }
  }

  const headerCaption =
    kind === 'post_session' ? 'Thrill Form' : 'Pre-Session Questionnaire'

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
          {headerCaption}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
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
                {position + 1}{' '}
                <span className="text-gray-300">
                  / {visibleQuestions.length}
                </span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-light text-gray-900 leading-relaxed mb-8">
              {currentQuestion?.text}
            </h2>

            {/* Answer Input — switches by question type */}
            {currentQuestion?.type === 'scale' ? (
              <ScaleInput
                question={currentQuestion}
                value={currentAnswer}
                onChange={updateAnswer}
                disabled={isSubmitting}
              />
            ) : currentQuestion?.type === 'yes_no' ? (
              <YesNoInput
                value={currentAnswer}
                onChange={updateAnswer}
                disabled={isSubmitting}
              />
            ) : (
              <textarea
                ref={textareaRef}
                value={currentAnswer}
                onChange={e => updateAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                placeholder={
                  currentQuestion?.optional
                    ? 'Optional — leave blank if you have nothing to add'
                    : 'Type your answer here...'
                }
                className="w-full bg-transparent border-0 border-b-2 border-gray-200 focus:border-gray-900 text-lg text-gray-800 placeholder-gray-300 resize-none outline-none pb-3 transition-colors duration-200 min-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                rows={3}
              />
            )}
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
              disabled={!canAdvance || isAnimating || isSubmitting}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all ${
                canAdvance
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
                {currentQuestion?.optional && !currentAnswer.trim()
                  ? 'Skip'
                  : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>

          {/* Keyboard hint — only useful for text inputs */}
          {currentQuestion?.type !== 'scale' &&
            currentQuestion?.type !== 'yes_no' && (
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
            )}
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 text-center">
        <p className="text-xs text-gray-300">Powered by Novus Global</p>
      </div>
    </div>
  )
}

// ---------- Sub-components ----------

interface ScaleInputProps {
  question: QuestionItem
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function ScaleInput({ question, value, onChange, disabled }: ScaleInputProps) {
  const min = question.scale_min ?? 1
  const max = question.scale_max ?? 10
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const selected = value ? Number(value) : null

  return (
    <div>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
        {numbers.map(n => {
          const isSelected = selected === n
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(String(n))}
              className={`aspect-square min-h-[44px] flex items-center justify-center rounded-lg border-2 text-base sm:text-lg font-semibold transition-all ${
                isSelected
                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm scale-105'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:text-gray-900'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={`Rate ${n}`}
              aria-pressed={isSelected}
            >
              {n}
            </button>
          )
        })}
      </div>
      {(question.scale_min_label || question.scale_max_label) && (
        <div className="flex justify-between mt-3 text-xs text-gray-400">
          <span>
            {min}
            {question.scale_min_label ? ` — ${question.scale_min_label}` : ''}
          </span>
          <span>
            {max}
            {question.scale_max_label ? ` — ${question.scale_max_label}` : ''}
          </span>
        </div>
      )}
    </div>
  )
}

interface YesNoInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function YesNoInput({ value, onChange, disabled }: YesNoInputProps) {
  const normalized = value.trim().toLowerCase()
  return (
    <div className="flex gap-3 sm:gap-4">
      {(['yes', 'no'] as const).map(opt => {
        const isSelected = normalized === opt
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={`flex-1 py-4 sm:py-5 rounded-lg border-2 text-base sm:text-lg font-semibold transition-all capitalize ${
              isSelected
                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:text-gray-900'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-pressed={isSelected}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
