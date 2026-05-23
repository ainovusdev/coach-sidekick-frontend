'use client'

import { Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { AgentChat } from '@/components/admin/agent/agent-chat'

export default function AdminAgentPage() {
  return (
    <div>
      <PageHeader
        title="AI Agent"
        description="Ask questions about coaches, clients, sessions, and analytics. The agent queries the live database, builds charts, and explains what it finds."
        icon={Sparkles}
      />
      <AgentChat />
    </div>
  )
}
