import posthog from 'posthog-js'
import { isReplayExcludedPath } from './src/lib/posthog-replay'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: '/ingest',
  ui_host: 'https://us.posthog.com',
  defaults: '2026-01-30',
  capture_exceptions: true,
  debug: process.env.NODE_ENV === 'development',
  session_recording: {
    // Mask everything typed (notes, agent composer, forms, search). Page text
    // stays visible; the most sensitive routes are excluded from recording
    // entirely (see isReplayExcludedPath + SessionReplayController).
    maskAllInputs: true,
  },
  // Fail-safe: if a user hard-loads directly onto a sensitive route, don't
  // start recording. SessionReplayController handles subsequent SPA navigation.
  disable_session_recording:
    typeof window !== 'undefined' &&
    isReplayExcludedPath(window.location.pathname),
})
