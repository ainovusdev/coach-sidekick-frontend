'use client'

import { SessionsTab } from './sessions-tab'
import { ChatTab } from './chat-tab'

interface SessionsChatTabProps {
  sessions: any[] | null
  client: any
  isViewer: boolean
  onAddSession: () => void
}

export function SessionsChatTab({
  sessions,
  client,
  isViewer,
  onAddSession,
}: SessionsChatTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left: Past Sessions */}
      <div className="h-[800px]">
        <SessionsTab
          sessions={sessions}
          client={client}
          isViewer={isViewer}
          onAddSession={onAddSession}
        />
      </div>

      {/* Right: Chat Widget */}
      <div className="h-[800px]">
        <ChatTab
          clientId={client.id}
          clientName={client.name}
          isViewer={isViewer}
        />
      </div>
    </div>
  )
}
