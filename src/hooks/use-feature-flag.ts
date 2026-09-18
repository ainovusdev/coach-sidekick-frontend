import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

/**
 * Flags answered `true` without asking PostHog.
 *
 * PostHog only answers when it has a project token. Without one `posthog.init`
 * bails, `isFeatureEnabled` returns undefined, and every flagged surface stays
 * hidden forever. That is right for production — a flag that cannot be read is
 * a flag that is off — but wrong everywhere the token does not exist: local
 * development, the Playwright suite, and the Railway staging environment, which
 * deliberately shares no state with the production PostHog project.
 *
 * So the list is build-time, not runtime. `NEXT_PUBLIC_*` is inlined by Next.js
 * when the bundle is compiled, so nothing set on a running server can change
 * it: forcing a flag on in production would take someone adding this variable
 * to the production Vercel project and rebuilding from `main`. It is set only
 * on the `staging` branch's preview environment, and `next build` from `main`
 * compiles the empty string below into every chunk.
 *
 * Development keeps its own default so the features are visible while they are
 * being built, and so the e2e suite sees them. Set the variable to an empty
 * string to look at the flags-off experience.
 *
 * `proficiency-rubric` is deliberately absent: it is already live and gates a
 * section on its own terms, so its behaviour must not change here.
 */
const FORCED_ON_KEYS =
  process.env.NEXT_PUBLIC_FEATURE_FLAGS_FORCE_ON ??
  (process.env.NODE_ENV === 'development'
    ? 'sandboxes,notifications,comment-threads'
    : '')

const FORCED_ON: ReadonlySet<string> = new Set(
  FORCED_ON_KEYS.split(',')
    .map(key => key.trim())
    .filter(Boolean),
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
  const forced = FORCED_ON.has(flagKey)
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
