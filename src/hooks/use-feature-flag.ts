import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

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
  const [enabled, setEnabled] = useState<boolean>(false)

  useEffect(() => {
    // Reflect the current value immediately if flags are already loaded.
    setEnabled(posthog.isFeatureEnabled(flagKey) ?? false)

    // Re-evaluate whenever flags (re)load. onFeatureFlags returns an
    // unsubscribe function for cleanup.
    return posthog.onFeatureFlags(() => {
      setEnabled(posthog.isFeatureEnabled(flagKey) ?? false)
    })
  }, [flagKey])

  return enabled
}
