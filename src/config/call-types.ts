// What kind of call a session is. Only coaching calls are evaluated (scores,
// insights) and get the pre-session questionnaire, Thrill form and coach
// reflection. Values MUST match the backend (app/services/call_types.py).
// Not to be confused with `session_type`, which is the capture mode (bot/manual).

export type CallType =
  | 'coaching'
  | 'discovery'
  | 'intake'
  | 'vision'
  | 'celebration'
  | 'onboarding'
  | 'check_in'

export const DEFAULT_CALL_TYPE: CallType = 'coaching'

export const CALL_TYPE_OPTIONS: { value: CallType; label: string }[] = [
  { value: 'coaching', label: 'Coaching call' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'intake', label: 'Intake' },
  { value: 'vision', label: 'Vision' },
  { value: 'celebration', label: 'Celebration / wins' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'check_in', label: 'Check-in' },
]

const LABELS = Object.fromEntries(
  CALL_TYPE_OPTIONS.map(o => [o.value, o.label]),
) as Record<CallType, string>

export function callTypeLabel(value?: string | null): string {
  return LABELS[(value as CallType) ?? DEFAULT_CALL_TYPE] ?? LABELS.coaching
}

/** A missing value is a coaching call (older payloads, default column value). */
export function isCoachingCall(value?: string | null): boolean {
  return !value || value === 'coaching'
}

/** "Onboarding call", "Discovery call", ... for sentences. */
export function callTypeNoun(value?: string | null): string {
  if (isCoachingCall(value)) return 'Coaching call'
  if (value === 'celebration') return 'Celebration call'
  return `${callTypeLabel(value)} call`
}
