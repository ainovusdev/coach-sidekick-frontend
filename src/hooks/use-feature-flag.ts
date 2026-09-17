import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

/**
 * Flags answered `true` without asking PostHog — **in development only**.
 *
 * PostHog only answers when it has a project token. Without one `posthog.init`
 * bails, `isFeatureEnabled` returns undefined, and every flagged surface stays
 * hidden forever. That is right for production — a flag that cannot be read is
 * a flag that is off — but wrong everywhere the token does not exist, and no
 * token is set for local development or for the Playwright suite. Gating the
 * bell, the comment threads and the sandbox surface on PostHog therefore made
 * all three invisible there: the features could not be seen while building them
 * and eight e2e specs went red against working code.
 *
 * `process.env.NODE_ENV` is `development` under `next dev` and `production`
 * under `next build`, and Next.js inlines it at build time, so this set is
 * provably empty in every production bundle — the flags cannot be forced on in
 * production by any environment variable, including a missing PostHog token.
 *
 * `proficiency-rubric` is deliberately absent: it is already live and gates a
 * section on its own terms, so its behaviour must not change here.
 *
 * Override with `NEXT_PUBLIC_FEATURE_FLAGS_FORCE_ON` (comma-separated keys, or
 * empty to force nothing) to look at the flags-off experience in development.
 */
const DEV_FORCED_ON: ReadonlySet<string> = new Set(
  process.env.NODE_ENV === 'development'
    ? (
        process.env.NEXT_PUBLIC_FEATURE_FLAGS_FORCE_ON ??
        'sandboxes,notifications,comment-threads'
      )
        .split(',')
        .map(key => key.trim())
        .filter(Boolean)
    : [],
)

/**
 * Subscribe to a PostHog boolean feature flag.
 *
 * Uses the global `posthog` singleton (initialized in
 * `instrumentation-client.ts`) rather than `PostHogProvider`, matching how the
 * rest of the app consumes PostHog. Returns `false` until flags have loaded,
 * then re-renders whenever the flag resolves or changes — including after
 * `posthog.identify()` on login, which reloads flags against the user's latest
 * person properties (e.g. `roles`).
 */
export function useFeatureFlagEnabled(flagKey: string): boolean {
  const forced = DEV_FORCED_ON.has(flagKey)
  const [enabled, setEnabled] = useState<boolean>(forced)

  useEffect(() => {
    // Kept inside the effect so the hook order never changes between renders.
    if (forced) return

    // Reflect the current value immediately if flags are already loaded.
    setEnabled(posthog.isFeatureEnabled(flagKey) ?? false)

    // Re-evaluate whenever flags (re)load. onFeatureFlags returns an
    // unsubscribe function for cleanup.
    return posthog.onFeatureFlags(() => {
      setEnabled(posthog.isFeatureEnabled(flagKey) ?? false)
    })
  }, [flagKey, forced])

  return enabled
}
