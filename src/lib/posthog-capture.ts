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

// Last-seen timestamps (monotonic ms) per throttle key.
const throttleWindows = new Map<string, number>()

/**
 * Like `captureException`, but drops repeat reports of the same `key` within
 * `windowMs`. Use for high-frequency failure sites — WebSocket/voice reconnect
 * storms, retried API calls — so a single incident doesn't flood error
 * tracking. Uses monotonic `performance.now()` so it's immune to clock changes.
 */
export function captureExceptionThrottled(
  key: string,
  error: unknown,
  properties?: Record<string, unknown>,
  windowMs = 60_000,
): void {
  if (typeof window === 'undefined') return
  const now = performance.now()
  const last = throttleWindows.get(key)
  if (last !== undefined && now - last < windowMs) return
  throttleWindows.set(key, now)
  captureException(error, properties)
}
