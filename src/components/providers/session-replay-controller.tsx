'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'
import { isReplayExcludedPath } from '@/lib/posthog-replay'

/**
 * Starts/stops PostHog session recording per route so sensitive surfaces
 * (transcripts, live meetings, AI chat) are never captured. Mounted once at the
 * app root; runs on every client navigation. Recording is enabled in
 * `instrumentation-client.ts`; this component only gates *where* it runs.
 */
export function SessionReplayController() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    if (isReplayExcludedPath(pathname)) {
      posthog.stopSessionRecording()
    } else if (!posthog.sessionRecordingStarted()) {
      posthog.startSessionRecording()
    }
  }, [pathname])

  return null
}
