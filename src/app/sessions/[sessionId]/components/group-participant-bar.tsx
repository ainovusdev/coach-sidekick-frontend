'use client'

import { cn } from '@/lib/utils'
import { Users } from 'lucide-react'

interface Participant {
  client_id: string
  client_name: string
  client_email?: string | null
}

interface GroupParticipantBarProps {
  participants: Participant[]
  selectedClientId: string | null
  onSelectClient: (clientId: string | null) => void
}

export function GroupParticipantBar({
  participants,
  selectedClientId,
  onSelectClient,
}: GroupParticipantBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <Users className="h-4 w-4 text-app-secondary flex-shrink-0" />

      {/* All Participants pill */}
      <button
        onClick={() => onSelectClient(null)}
        className={cn(
          'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
          selectedClientId === null
            ? 'bg-app-primary text-white'
            : 'bg-app-surface text-app-secondary hover:bg-app-border',
        )}
      >
        All Participants
      </button>

      {/* Individual participant pills */}
      {participants.map(p => (
        <button
          key={p.client_id}
          onClick={() => onSelectClient(p.client_id)}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            selectedClientId === p.client_id
              ? 'bg-app-primary text-white'
              : 'bg-app-surface text-app-secondary hover:bg-app-border',
          )}
        >
          {p.client_name}
        </button>
      ))}
    </div>
  )
}
