import posthog from 'posthog-js'

/**
 * Report an error to PostHog error tracking.
 *
 * PostHog's `capture_exceptions` only auto-captures errors that reach the
 * browser's global `onerror`/`unhandledrejection` handlers. This app catches
 * errors first (React error boundaries, TanStack Query `onError`), so those
 * exceptions never reach PostHog. Call this at those choke points instead.
 *
 * Guarded for SSR/no-window. This is also the single place to scrub PII from
 * error payloads in the future.
 */
export function captureException(
  error: unknown,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return
  const err = error instanceof Error ? error : new Error(String(error))
  posthog.captureException(err, properties)
}
