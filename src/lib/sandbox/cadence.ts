/**
 * Sandbox cadence maths — mirrors app/services/sandbox_cadence.py so the
 * group builder can give live feedback. The server recomputes on save.
 */

import type { Cadence, CadencePer, CadenceAgreement } from '@/types/sandbox'

export const DEFAULT_SESSION_LENGTH = 45
export const DEFAULT_CADENCE: Cadence = {
  shape: 'range',
  min: 2,
  max: 3,
  per: 'month',
}

export const PERIODS_PER_MONTH: Record<CadencePer, number> = {
  month: 1,
  fortnight: 26 / 12,
  week: 52 / 12,
}

export const CADENCE_PRESETS: {
  key: string
  label: string
  cadence: Cadence
}[] = [
  {
    key: '2-3-month',
    label: '2–3 per month',
    cadence: { shape: 'range', min: 2, max: 3, per: 'month' },
  },
  {
    key: '1-fortnight',
    label: '1 per fortnight',
    cadence: { shape: 'rate', count: 1, per: 'fortnight' },
  },
  {
    key: '1-week',
    label: '1 per week',
    cadence: { shape: 'rate', count: 1, per: 'week' },
  },
]

/** Half-up rounding (Python's round() is banker's; the backend uses ROUND_HALF_UP). */
function roundHalfUp(n: number): number {
  return Math.floor(n + 0.5)
}

export function expectedSessions(
  hours: number | string | null | undefined,
  sessionLengthMinutes: number | null | undefined,
): number | null {
  const h = typeof hours === 'string' ? parseFloat(hours) : hours
  if (h == null || Number.isNaN(h) || h <= 0) return null
  if (!sessionLengthMinutes || sessionLengthMinutes <= 0) return null
  return roundHalfUp((h * 60) / sessionLengthMinutes)
}

export function describeCadence(
  cadence: Cadence | null | undefined,
): string | null {
  if (!cadence) return null
  switch (cadence.shape) {
    case 'range': {
      const head =
        cadence.min === cadence.max
          ? `${cadence.min}`
          : `${cadence.min}–${cadence.max}`
      return `${head} per ${cadence.per}`
    }
    case 'rate':
      return `${cadence.count} per ${cadence.per}`
    case 'total':
      return `${cadence.count} over ${cadence.span_months} ${cadence.span_months === 1 ? 'month' : 'months'}`
  }
}

export function projectCadence(
  cadence: Cadence,
  termMonths: number,
): [number, number] {
  switch (cadence.shape) {
    case 'range': {
      const periods = PERIODS_PER_MONTH[cadence.per] * termMonths
      return [
        roundHalfUp(cadence.min * periods),
        roundHalfUp(cadence.max * periods),
      ]
    }
    case 'rate': {
      const n = roundHalfUp(
        cadence.count * PERIODS_PER_MONTH[cadence.per] * termMonths,
      )
      return [n, n]
    }
    case 'total': {
      const n = roundHalfUp((cadence.count * termMonths) / cadence.span_months)
      return [n, n]
    }
  }
}

export function cadenceAgreement(
  cadence: Cadence | null | undefined,
  termMonths: number,
  expected: number | null,
): CadenceAgreement | null {
  if (!cadence) return null
  const [lo, hi] = projectCadence(cadence, termMonths)
  const text = describeCadence(cadence)
  const over = `over ${termMonths} months`
  let base: string
  if (cadence.shape === 'range' && lo !== hi)
    base = `${text} ${over} is ${lo}–${hi} sessions`
  else if (cadence.shape === 'range') base = `${text} ${over} is ${lo} sessions`
  else if (cadence.shape === 'rate')
    base = `${text} ${over} is about ${lo} sessions`
  else base = `${text}, repeated across ${termMonths} months, is ${lo} sessions`

  if (expected == null) {
    return {
      lo,
      hi,
      expected: null,
      agrees: null,
      sentence: `${base} — but hours per coachee is still blank, so there is nothing to check it against yet.`,
    }
  }
  return {
    lo,
    hi,
    expected,
    agrees: lo <= expected && expected <= hi,
    sentence: `${base}; this contract expects ${expected}.`,
  }
}

export function cadenceEquals(
  a: Cadence | null | undefined,
  b: Cadence | null | undefined,
): boolean {
  if (!a || !b || a.shape !== b.shape) return false
  if (a.shape === 'range' && b.shape === 'range')
    return a.min === b.min && a.max === b.max && a.per === b.per
  if (a.shape === 'rate' && b.shape === 'rate')
    return a.count === b.count && a.per === b.per
  if (a.shape === 'total' && b.shape === 'total')
    return a.count === b.count && a.span_months === b.span_months
  return false
}

export function presetFor(cadence: Cadence | null | undefined): string | null {
  const hit = CADENCE_PRESETS.find(p => cadenceEquals(p.cadence, cadence))
  return hit ? hit.key : null
}

/** Sessions per month, for the tick rail (average of a range). */
export function sessionsPerMonth(cadence: Cadence | null | undefined): number {
  if (!cadence) return 0
  switch (cadence.shape) {
    case 'range':
      return ((cadence.min + cadence.max) / 2) * PERIODS_PER_MONTH[cadence.per]
    case 'rate':
      return cadence.count * PERIODS_PER_MONTH[cadence.per]
    case 'total':
      return cadence.count / cadence.span_months
  }
}
