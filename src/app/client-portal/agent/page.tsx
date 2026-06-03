'use client'

import { AgentChat } from '@/components/admin/agent/agent-chat'

/**
 * Client-facing Sidekick Agent. Same component as the admin/coach agent, scoped
 * to this client's own data (the backend enforces it via RLS on the /client/agent
 * mount). Route guard + nav come from the client-portal layout. `?q=` / `?thread=`
 * deep-links (e.g. the dashboard embed's "Expand") are read by AgentChat itself.
 */
export default function ClientAgentPage() {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden">
      <AgentChat apiScope="client" />
    </div>
  )
}
