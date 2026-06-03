'use client'

import { AgentChat } from '@/components/admin/agent/agent-chat'
import { CoachRoute } from '@/components/auth/coach-route'
import PageLayout from '@/components/layout/page-layout'

/**
 * Coach-facing Sidekick Agent — the dedicated full-page console (left sidebar +
 * `?thread=` URL persistence). Same component as the admin agent, scoped to the
 * coach's own clients via RLS on the /coach/agent mount. Day-to-day the agent opens
 * as an on-page modal (the "Ask Sidekick" header bar / dashboard card); this page is
 * reached by the explicit "Open full page" control in that modal (carrying
 * `?thread=`) or the dashboard card's "Open" button. A `?q=` deep-link still works
 * for shared / direct links.
 */
export default function CoachAgentPage() {
  return (
    <CoachRoute>
      <PageLayout className="h-[calc(100vh-4rem)] overflow-hidden">
        <AgentChat apiScope="coach" />
      </PageLayout>
    </CoachRoute>
  )
}
