/**
 * Date Utilities
 *
 * Handles date parsing and formatting consistently across the app.
 * All dates from the backend are treated as UTC.
 * All dates displayed to users are converted to their local timezone.
 */

import {
  formatDistanceToNow as fnsFormatDistanceToNow,
  format as fnsFormat,
  isPast as fnsIsPast,
  isAfter as fnsIsAfter,
  isBefore as fnsIsBefore,
} from 'date-fns'

/**
 * Parse a date string from the API into a Date object.
 * Handles both ISO strings with and without 'Z' suffix.
 * Dates without timezone info are treated as UTC.
 *
 * @param dateString - Date string from the API (ISO format)
 * @returns Date object in local timezone
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null

  // If the string doesn't end with 'Z' and doesn't have timezone offset,
  // append 'Z' to treat it as UTC
  let normalizedString = dateString
  if (!dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:\d{2}$/)) {
    // Replace space with T if present (some backends return "2024-01-15 10:30:00")
    normalizedString = dateString.replace(' ', 'T')
    // Append Z to indicate UTC
    if (!normalizedString.endsWith('Z')) {
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
 * Format a date for display (e.g., "Jan 15, 2024")
 *
 * @param dateString - Date string from the API
 * @param formatString - date-fns format string (default: 'PPP')
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | null | undefined,
  formatString: string = 'PPP',
): string {
  const date = parseDate(dateString)
  if (!date) return 'Unknown'

  return fnsFormat(date, formatString)
}

/**
 * Format a time only (e.g., "2:30 PM")
 *
 * @param dateString - Date string from the API
 * @returns Formatted time string
 */
export function formatTime(dateString: string | null | undefined): string {
  const date = parseDate(dateString)
  if (!date) return 'Unknown'

  return fnsFormat(date, 'p')
}

/**
 * Format a date with time (e.g., "Jan 15, 2024 at 10:30 AM")
 *
 * @param dateString - Date string from the API
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string | null | undefined): string {
  const date = parseDate(dateString)
  if (!date) return 'Unknown'

  return fnsFormat(date, "PPP 'at' p")
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
 * Create a UTC ISO string for a specific Date object.
 *
 * @param date - Date object to convert
 * @returns ISO string with Z suffix
 */
export function toUTC(date: Date): string {
  return date.toISOString()
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

/**
 * Check if date A is after date B.
 *
 * @param dateA - First date string
 * @param dateB - Second date string
 * @returns true if dateA is after dateB
 */
export function isAfterDate(
  dateA: string | null | undefined,
  dateB: string | null | undefined,
): boolean {
  const a = parseDate(dateA)
  const b = parseDate(dateB)
  if (!a || !b) return false
  return fnsIsAfter(a, b)
}

/**
 * Check if date A is before date B.
 *
 * @param dateA - First date string
 * @param dateB - Second date string
 * @returns true if dateA is before dateB
 */
export function isBeforeDate(
  dateA: string | null | undefined,
  dateB: string | null | undefined,
): boolean {
  const a = parseDate(dateA)
  const b = parseDate(dateB)
  if (!a || !b) return false
  return fnsIsBefore(a, b)
}
