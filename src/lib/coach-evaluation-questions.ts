export interface EvaluationQuestion {
  id: string
  text: string
}

export const EVALUATION_QUESTIONS: ReadonlyArray<EvaluationQuestion> = [
  {
    id: 'q1',
    text: 'The coach invites the client towards a clear, thrilling, measurable, and potentially transformative vision.',
  },
  {
    id: 'q2',
    text: 'The coach coaches in a way that max value for the call is clear and the client reports max value being created towards the end of the call.',
  },
  {
    id: 'q3',
    text: 'The coach expands what the client believes is possible.',
  },
  {
    id: 'q4',
    text: 'The coach invites client to make commitments not only to keep but to grow and holds space to test commitments before the client commits to them.',
  },
  {
    id: 'q5',
    text: 'The coach’s key tools are powerful questions and silence.',
  },
  {
    id: 'q6',
    text: 'The coach demonstrates all three levels of listening, including what the client is saying, noticing facial expressions, body language, and tests their intuition when they have notices.',
  },
  {
    id: 'q7',
    text: 'The coach invites the client into ownership, and does not enroll in consulting or solving for the client.',
  },
  {
    id: 'q8',
    text: 'The coach guides the conversation to explore new ways of being to accomplish their stated max value.',
  },
  {
    id: 'q9',
    text: 'The coach strategically disrupts in ways few other people would in the client’s life. Whatever the response, the coach doesn’t "bail out" but advocates for the client to choose to be resourceful.',
  },
  {
    id: 'q10',
    text: 'The coach demonstrates ability to intentionally play diverse energies to draw out client’s full participation.',
  },
]

export type ScoreValue = number | null

export interface ScoreOption {
  value: ScoreValue
  label: string
  // Tailwind classes for background and text when selected/unselected
  selectedClass: string
  unselectedClass: string
}

export const SCORE_OPTIONS: ReadonlyArray<ScoreOption> = [
  {
    value: null,
    label: 'Not Observed',
    selectedClass: 'bg-gray-300 text-gray-900 ring-2 ring-gray-500',
    unselectedClass: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  },
  {
    value: 1,
    label: '1',
    selectedClass: 'bg-pink-300 text-pink-950 ring-2 ring-pink-600',
    unselectedClass: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
  },
  {
    value: 2,
    label: '2',
    selectedClass: 'bg-orange-300 text-orange-950 ring-2 ring-orange-600',
    unselectedClass: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  },
  {
    value: 3,
    label: '3',
    selectedClass: 'bg-yellow-300 text-yellow-950 ring-2 ring-yellow-600',
    unselectedClass: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
  },
  {
    value: 4,
    label: '4',
    selectedClass: 'bg-green-300 text-green-950 ring-2 ring-green-600',
    unselectedClass: 'bg-green-100 text-green-700 hover:bg-green-200',
  },
]

export function scoreLabel(value: ScoreValue | undefined): string {
  if (value === null) return 'Not Observed'
  if (typeof value === 'number') return String(value)
  return '—'
}

export function scoreChipClass(value: ScoreValue | undefined): string {
  switch (value) {
    case null:
      return 'bg-gray-200 text-gray-700'
    case 1:
      return 'bg-pink-200 text-pink-800'
    case 2:
      return 'bg-orange-200 text-orange-800'
    case 3:
      return 'bg-yellow-200 text-yellow-800'
    case 4:
      return 'bg-green-200 text-green-800'
    default:
      return 'bg-gray-100 text-gray-500'
  }
}

export function averageScore(
  evaluations: ReadonlyArray<{ scores: Record<string, number | null> }>,
): number | null {
  const numeric: number[] = []
  for (const e of evaluations) {
    for (const v of Object.values(e.scores)) {
      if (typeof v === 'number') numeric.push(v)
    }
  }
  if (numeric.length === 0) return null
  return numeric.reduce((a, b) => a + b, 0) / numeric.length
}
