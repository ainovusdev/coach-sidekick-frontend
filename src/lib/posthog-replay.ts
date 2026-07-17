/**
 * Routes whose rendered content is too sensitive to ever record in session
 * replay — full transcripts, live meetings, and AI chat. Under our inputs-only
 * masking, page *text* stays visible, so these surfaces must be excluded
 * entirely rather than masked.
 *
 * Used in two places: `instrumentation-client.ts` (fail-safe when a user
 * hard-loads directly onto one of these routes) and `SessionReplayController`
 * (start/stop recording as the user navigates between routes).
 */
export function isReplayExcludedPath(pathname: string): boolean {
  if (!pathname) return false

  // Live meeting / real-time transcript views (coach + external client).
  if (pathname.startsWith('/meeting/')) return true
  if (pathname.startsWith('/client-meeting/')) return true

  // External questionnaire intake (client PII: /questionnaire/<token>). Answers
  // are masked as inputs, but the questions/page text would still be visible.
  if (pathname.startsWith('/questionnaire/')) return true

  // AI agent / chat pages.
  if (
    pathname === '/agent' ||
    pathname === '/client-portal/agent' ||
    pathname === '/admin/agent' ||
    pathname === '/admin/agent-chats'
  ) {
    return true
  }

  const seg = pathname.split('/').filter(Boolean)

  // Session detail / review / group (transcripts + AI analysis) — but NOT the
  // list (/sessions), /sessions/create, or /sessions/shared.
  if (
    seg[0] === 'sessions' &&
    seg[1] &&
    seg[1] !== 'create' &&
    seg[1] !== 'shared'
  ) {
    return true
  }

  // Client-portal session detail — but NOT the list (/client-portal/sessions).
  if (seg[0] === 'client-portal' && seg[1] === 'sessions' && seg[2]) {
    return true
  }

  return false
}
