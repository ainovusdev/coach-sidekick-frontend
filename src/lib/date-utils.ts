/**
 * Date Utilities
 *
 * Handles date parsing and formatting consistently across the app.
 * All dates from the backend are treated as UTC.
 *
 * Two distinct formatting conventions:
 * - INSTANT fields (timestamps with a meaningful time-of-day: scheduled_for,
 *   created_at, started_at, session_date, …) are rendered in the user's
 *   timezone via `formatDate` / `formatTime`. The target zone resolves to the
 *   saved coach timezone (set once at app root via `setActiveTimeZone`) and
 *   falls back to the browser's zone.
 * - DATE-ONLY fields (a calendar day with no time: commitment/sprint
 *   target_date, start_date, end_date, daily-metric date) must be rendered in
 *   UTC via `formatDateOnly` to avoid timezone-induced day shifts (e.g.
 *   "2026-06-15" displaying as Jun 14 in a negative-offset zone).
 */

import {
  formatDistanceToNow as fnsFormatDistanceToNow,
  format as fnsFormat,
  isPast as fnsIsPast,
} from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

/**
 * Module-level "active" timezone for INSTANT formatting. Populated once near
 * the app root by `useUserTimezone()` with the coach's saved IANA zone, so the
 * formatters below render in the right zone without threading a tz argument
 * through every call site. Null until set → callers fall back to browser zone.
 */
let activeTimeZone: string | null = null

export function setActiveTimeZone(tz: string | null): void {
  activeTimeZone = tz
}

function browserTimeZone(): string {
  if (typeof Intl === 'undefined') return 'UTC'
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/**
 * Resolve the IANA timezone to render an INSTANT in.
 * Priority: explicit arg → active (saved coach) zone → browser zone.
 * Guards SSR with 'UTC' so server and the first client render agree (the
 * post-mount re-render then applies the real browser/saved zone).
 */
export function resolveTimeZone(tz?: string | null): string {
  if (tz) return tz
  if (activeTimeZone) return activeTimeZone
  if (typeof window === 'undefined') return 'UTC'
  return browserTimeZone()
}

/**
 * Parse a date string from the API into a Date object.
 * Handles both ISO strings with and without 'Z' suffix.
 * Dates without timezone info are treated as UTC.
 *
 * @param dateString - Date string from the API (ISO format)
 * @returns Date object
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null

  // If the string doesn't end with 'Z' and doesn't have timezone offset,
  // append 'Z' to treat it as UTC
  let normalizedString = dateString
  if (!dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:\d{2}$/)) {
    // Replace space with T if present (some backends return "2024-01-15 10:30:00")
    normalizedString = dateString.replace(' ', 'T')
    // Date-only strings (e.g. "2024-06-15") need a time before the 'Z' suffix —
    // Safari rejects "2024-06-15Z" as an invalid date.
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedString)) {
      normalizedString += 'T00:00:00Z'
    } else if (!normalizedString.endsWith('Z')) {
      // Append Z to indicate UTC
      normalizedString += 'Z'
    }
  }

  const date = new Date(normalizedString)

  // Return null for invalid dates
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString)
    return null
  }

  return date
}

/**
 * Convert a parsed UTC Date to a "fake local" Date that represents the
 * same calendar date/time in UTC. This allows date-fns format() (which
 * always uses local time) to render the UTC values.
 */
function toUTCLocal(date: Date): Date {
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000)
}

/**
 * Parse an API date string into a Date that renders the correct calendar day in
 * LOCAL time (for <Calendar> / date-picker `selected` values). Returns undefined
 * when the string is missing or unparseable.
 *
 * Without this, `new Date("2024-06-15")` parses as UTC midnight, so in a
 * negative-offset timezone the picker highlights the previous day.
 */
export function parseDateForPicker(
  dateString: string | null | undefined,
): Date | undefined {
  const date = parseDate(dateString)
  return date ? toUTCLocal(date) : undefined
}

/**
 * Format a date for relative display (e.g., "2 hours ago")
 *
 * @param dateString - Date string from the API
 * @param options - Options for formatDistanceToNow
 * @returns Formatted relative time string
 */
export function formatRelativeTime(
  dateString: string | null | undefined,
  options?: { addSuffix?: boolean },
): string {
  const date = parseDate(dateString)
  if (!date) return 'Unknown'

  return fnsFormatDistanceToNow(date, { addSuffix: options?.addSuffix ?? true })
}

/**
 * Format an INSTANT date in the user's timezone (e.g., "Jan 15, 2024").
 * Use for timestamps with a meaningful time-of-day. For calendar-day-only
 * values use `formatDateOnly` instead.
 *
 * @param dateString - Date string from the API
 * @param formatString - date-fns format string (default: 'PPP')
 * @param tz - Optional explicit IANA zone; defaults to the resolved user zone
 * @returns Formatted date string in the resolved timezone
 */
export function formatDate(
  dateString: string | null | undefined,
  formatString: string = 'PPP',
  tz?: string | null,
): string {
  const date = parseDate(dateString)
  if (!date) return 'Unknown'

  return formatInTimeZone(date, resolveTimeZone(tz), formatString)
}

/**
 * Format an INSTANT as time only in the user's timezone (e.g., "2:30 PM").
 *
 * @param dateString - Date string from the API
 * @param tz - Optional explicit IANA zone; defaults to the resolved user zone
 * @returns Formatted time string in the resolved timezone
 */
export function formatTime(
  dateString: string | null | undefined,
  tz?: string | null,
): string {
  const date = parseDate(dateString)
  if (!date) return 'Unknown'

  return formatInTimeZone(date, resolveTimeZone(tz), 'p')
}

/**
 * Format a DATE-ONLY value in UTC (e.g., "Jan 15, 2024").
 * Prevents timezone-induced day shifts for calendar-day values that have no
 * meaningful time-of-day (commitment/sprint dates, daily-metric dates).
 *
 * @param dateString - Date string from the API
 * @param formatString - date-fns format string (default: 'PPP')
 * @returns Formatted date string rendered as its UTC calendar day
 */
export function formatDateOnly(
  dateString: string | null | undefined,
  formatString: string = 'PPP',
): string {
  const date = parseDate(dateString)
  if (!date) return 'Unknown'

  return fnsFormat(toUTCLocal(date), formatString)
}

/**
 * Create a UTC ISO string for the current time.
 * Use this when creating optimistic updates.
 *
 * @returns Current time as ISO string with Z suffix
 */
export function nowUTC(): string {
  return new Date().toISOString()
}

/**
 * Check if a date is in the past.
 *
 * @param dateString - Date string from the API
 * @returns true if the date is in the past
 */
export function isPastDate(dateString: string | null | undefined): boolean {
  const date = parseDate(dateString)
  if (!date) return false
  return fnsIsPast(date)
}
