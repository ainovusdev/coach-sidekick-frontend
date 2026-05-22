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
    selectedClass: 'bg-line text-ink ring-2 ring-line-strong',
    unselectedClass: 'bg-surface-3 text-ink-3 hover:bg-surface-3',
  },
  {
    value: 1,
    label: '1',
    selectedClass: 'bg-vermillion text-ink-on-dark ring-2 ring-vermillion',
    unselectedClass:
      'bg-vermillion-bg text-vermillion hover:bg-vermillion-bg/80',
  },
  {
    value: 2,
    label: '2',
    selectedClass: 'bg-amber-token text-ink-on-dark ring-2 ring-amber-token',
    unselectedClass:
      'bg-amber-token-bg text-amber-token hover:bg-amber-token-bg/80',
  },
  {
    value: 3,
    label: '3',
    selectedClass: 'bg-ds-accent text-ink-on-dark ring-2 ring-ds-accent',
    unselectedClass: 'bg-ds-accent-bg text-ds-accent hover:bg-ds-accent-bg/80',
  },
  {
    value: 4,
    label: '4',
    selectedClass: 'bg-forest text-ink-on-dark ring-2 ring-forest',
    unselectedClass: 'bg-forest-bg text-forest hover:bg-forest-bg/80',
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
      return 'bg-surface-3 text-ink-2'
    case 1:
      return 'bg-vermillion-bg text-vermillion'
    case 2:
      return 'bg-amber-token-bg text-amber-token'
    case 3:
      return 'bg-ds-accent-bg text-ds-accent'
    case 4:
      return 'bg-forest-bg text-forest'
    default:
      return 'bg-surface-3 text-ink-3'
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
