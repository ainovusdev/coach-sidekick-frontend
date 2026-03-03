'use client'

import { GroupSession } from '@/types/group-session'
import { GroupSessionBadge } from './group-session-badge'

interface GroupMeetingHeaderProps {
  session: GroupSession
}

export function GroupMeetingHeader({ session }: GroupMeetingHeaderProps) {
  const participants = session.participants

  return (
    <div className="flex items-center gap-3">
      <GroupSessionBadge count={session.participant_count} />
      <div className="flex -space-x-2">
        {participants.slice(0, 5).map(p => (
          <div
            key={p.client_id}
            className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center"
            title={p.client_name}
          >
            <span className="text-xs font-medium text-gray-600">
              {p.client_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
        ))}
        {participants.length > 5 && (
          <div className="w-7 h-7 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              +{participants.length - 5}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
