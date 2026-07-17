'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  List,
  Square,
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import posthog from 'posthog-js'
import { QuestionnaireService } from '@/services/questionnaire-service'
import type {
  QuestionItem,
  QuestionnaireAnswerItem,
  QuestionnaireKind,
} from '@/types/questionnaire'

type ViewMode = 'step' | 'list'

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

  // Step (Typeform-style, one at a time) is the default; the toggle lets the
  // user switch to the all-questions list view. Not persisted — always opens
  // in step mode.
  const [viewMode, setViewMode] = useState<ViewMode>('step')

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
  const hasAnswer = currentAnswer.trim().length > 0
  const isFirst = position === 0
  const isLast = position === visibleQuestions.length - 1

  const answeredCount = visibleQuestions.filter(
    q => (answers[q.index] || '').trim().length > 0,
  ).length

  const progress =
    visibleQuestions.length > 0
      ? viewMode === 'list'
        ? (answeredCount / visibleQuestions.length) * 100
        : ((position + 1) / visibleQuestions.length) * 100
      : 0

  const setAnswerFor = (index: number, value: string) => {
    const updated = { ...answers, [index]: value }
    setAnswers(updated)
    saveToStorage(token, updated)
  }

  const updateAnswer = (value: string) => {
    if (!currentQuestion) return
    setAnswerFor(currentQuestion.index, value)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      // Only submit answers for currently-visible questions; conditional
      // branches that the user routed around shouldn't carry stale text.
      // Skipped (blank) questions are simply omitted.
      const visibleIndexes = new Set(visibleQuestions.map(q => q.index))
      const allAnswers = questions
        .filter(q => visibleIndexes.has(q.index))
        .map(q => ({
          question_index: q.index,
          answer: (answers[q.index] || '').trim(),
        }))
        .filter(a => a.answer.length > 0)

      await QuestionnaireService.submitAll(token, allAnswers)
      posthog.capture('questionnaire_completed', {
        kind,
        question_count: visibleQuestions.length,
        answered_count: allAnswers.length,
        view_mode: viewMode,
      })
      clearStorage(token)
      onComplete()
    } catch {
      toast.error('Failed to submit. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Keep a ref to the latest submit so the list-mode key listener (subscribed
  // once per mode) always calls the current-closure version.
  const submitRef = useRef(handleSubmit)
  submitRef.current = handleSubmit

  const goNext = async () => {
    if (isAnimating || !currentQuestion) return

    if (isLast) {
      await handleSubmit()
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

  // In list mode, Cmd/Ctrl+Enter submits the whole form.
  useEffect(() => {
    if (viewMode !== 'list') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        submitRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewMode])

  const headerCaption =
    kind === 'post_session' ? 'Thrill Form' : 'Pre-Session Questionnaire'

  return (
    <div className="min-h-screen flex flex-col  ">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-surface-3">
          <div
            className="h-full bg-ink transition-all duration-500 ease-out"
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
        <p className="text-xs uppercase tracking-widest text-ink-4 font-medium">
          {headerCaption}
        </p>
        <ModeToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {/* Main Content */}
      {viewMode === 'list' ? (
        <div className="flex-1 flex justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            {/* Answered counter */}
            <div className="mb-8">
              <span className="text-sm text-ink-4 font-medium">
                {answeredCount}{' '}
                <span className="text-ink-2">
                  of {visibleQuestions.length} answered
                </span>
              </span>
            </div>

            <div className="space-y-10">
              {visibleQuestions.map((q, i) => (
                <div key={q.index}>
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-sm text-ink-4 font-medium tabular-nums pt-1">
                      {i + 1}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-light text-ink leading-relaxed">
                      {q.text}
                    </h2>
                  </div>
                  <QuestionInput
                    question={q}
                    value={answers[q.index] || ''}
                    onChange={value => setAnswerFor(q.index, value)}
                    disabled={isSubmitting}
                  />
                </div>
              ))}
            </div>

            {/* Submit */}
            <div className="flex justify-end mt-12">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all bg-ink text-ink-on-dark hover:bg-ink-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Complete
                    <Check className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {/* Keyboard hint */}
            <p className="text-center text-xs text-ink-2 mt-8">
              Answer as many as you like — blank questions are skipped. Press{' '}
              <kbd className="px-1.5 py-0.5 bg-surface-3 rounded text-ink-4 font-mono">
                ⌘
              </kbd>{' '}
              +{' '}
              <kbd className="px-1.5 py-0.5 bg-surface-3 rounded text-ink-4 font-mono">
                Enter
              </kbd>{' '}
              to submit
            </p>
          </div>
        </div>
      ) : (
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
                <span className="text-sm text-ink-4 font-medium">
                  {position + 1}{' '}
                  <span className="text-ink-2">
                    / {visibleQuestions.length}
                  </span>
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-light text-ink leading-relaxed mb-8">
                {currentQuestion?.text}
              </h2>

              {/* Answer Input — switches by question type */}
              {currentQuestion && (
                <QuestionInput
                  key={currentQuestion.index}
                  question={currentQuestion}
                  value={currentAnswer}
                  onChange={updateAnswer}
                  onKeyDown={handleKeyDown}
                  disabled={isSubmitting}
                  autoFocus
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
                    ? 'text-ink-2 cursor-not-allowed'
                    : 'text-ink-3 hover:text-ink hover:bg-surface-3'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                onClick={goNext}
                disabled={isAnimating || isSubmitting}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all ${
                  hasAnswer
                    ? 'bg-ink text-ink-on-dark hover:bg-ink-2 shadow-sm'
                    : 'bg-surface-3 text-ink-3 hover:text-ink'
                } ${isAnimating || isSubmitting ? 'cursor-not-allowed' : ''}`}
              >
                <span
                  className={
                    isSubmitting ? 'flex items-center gap-2' : 'hidden'
                  }
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </span>
                <span
                  className={
                    !isSubmitting && isLast
                      ? 'flex items-center gap-2'
                      : 'hidden'
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
                  {hasAnswer ? 'Next' : 'Skip'}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </div>

            {/* Keyboard hint — only useful for text inputs */}
            {currentQuestion?.type !== 'scale' &&
              currentQuestion?.type !== 'yes_no' && (
                <p className="text-center text-xs text-ink-2 mt-8">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 bg-surface-3 rounded text-ink-4 font-mono">
                    ⌘
                  </kbd>{' '}
                  +{' '}
                  <kbd className="px-1.5 py-0.5 bg-surface-3 rounded text-ink-4 font-mono">
                    Enter
                  </kbd>{' '}
                  to continue
                </p>
              )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pb-6 text-center">
        <p className="text-xs text-ink-2">Powered by Novus Global</p>
      </div>
    </div>
  )
}

// ---------- Sub-components ----------

interface QuestionInputProps {
  question: QuestionItem
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  disabled?: boolean
  autoFocus?: boolean
}

// Renders the correct input for a question's type. Shared by both view modes so
// the type-switch logic lives in exactly one place.
function QuestionInput({
  question,
  value,
  onChange,
  onKeyDown,
  disabled,
  autoFocus,
}: QuestionInputProps) {
  if (question.type === 'scale') {
    return (
      <ScaleInput
        question={question}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }
  if (question.type === 'yes_no') {
    return <YesNoInput value={value} onChange={onChange} disabled={disabled} />
  }
  return (
    <AutoTextarea
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      autoFocus={autoFocus}
      placeholder="Type your answer here, or leave blank to skip..."
    />
  )
}

interface AutoTextareaProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
}

// Self-managing auto-resize + optional auto-focus textarea. Owns its own ref so
// any number of instances (e.g. every row in list mode) size independently.
function AutoTextarea({
  value,
  onChange,
  onKeyDown,
  disabled,
  placeholder,
  autoFocus,
}: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Auto-resize to fit content.
  useEffect(() => {
    const el = ref.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.max(120, el.scrollHeight)}px`
    }
  }, [value])

  // Auto-focus (step mode only — list rows pass autoFocus={false}).
  useEffect(() => {
    if (!autoFocus) return
    const timer = setTimeout(() => {
      ref.current?.focus()
    }, 400)
    return () => clearTimeout(timer)
  }, [autoFocus])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full bg-transparent border-0 border-b-2 border-line focus:border-line text-lg text-ink-2 placeholder-ink-2 resize-none outline-none pb-3 transition-colors duration-200 min-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
      rows={3}
    />
  )
}

interface ModeToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

// Segmented Step/List control shown in the header.
function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const options = [
    { value: 'step' as const, label: 'Step', Icon: Square },
    { value: 'list' as const, label: 'List', Icon: List },
  ]
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-surface-3 p-1">
      {options.map(({ value, label, Icon }) => {
        const isActive = mode === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isActive
                ? 'bg-ink text-ink-on-dark shadow-sm'
                : 'text-ink-3 hover:text-ink'
            }`}
            aria-pressed={isActive}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

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
                  ? 'bg-ink text-ink-on-dark border-line shadow-sm scale-105'
                  : 'bg-surface-1 text-ink-2 border-line hover:border-line-strong hover:text-ink'
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
        <div className="flex justify-between mt-3 text-xs text-ink-4">
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
                ? 'bg-ink text-ink-on-dark border-line shadow-sm'
                : 'bg-surface-1 text-ink-2 border-line hover:border-line-strong hover:text-ink'
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
