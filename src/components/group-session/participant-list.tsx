'use client'

import { GroupSessionParticipant } from '@/types/group-session'
import { ParticipantCard } from './participant-card'

interface ParticipantListProps {
  participants: GroupSessionParticipant[]
  onParticipantClick?: (clientId: string) => void
}

export function ParticipantList({
  participants,
  onParticipantClick,
}: ParticipantListProps) {
  return (
    <div className="space-y-3">
      {participants.map(p => (
        <ParticipantCard
          key={p.client_id}
          participant={p}
          onClick={
            onParticipantClick
              ? () => onParticipantClick(p.client_id)
              : undefined
          }
        />
      ))}
    </div>
  )
}
