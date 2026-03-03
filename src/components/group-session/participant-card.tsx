'use client'

import { GroupSessionParticipant } from '@/types/group-session'
import { Card, CardContent } from '@/components/ui/card'
import { User, ChevronRight } from 'lucide-react'

interface ParticipantCardProps {
  participant: GroupSessionParticipant
  onClick?: () => void
  commitmentCount?: number
  noteCount?: number
}

export function ParticipantCard({
  participant,
  onClick,
  commitmentCount,
  noteCount: _noteCount,
}: ParticipantCardProps) {
  return (
    <Card
      className={`${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}
      onClick={onClick}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-sm">{participant.client_name}</p>
              {participant.client_email && (
                <p className="text-xs text-muted-foreground">
                  {participant.client_email}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {commitmentCount != null && (
              <span className="text-xs text-muted-foreground">
                {commitmentCount} commitment{commitmentCount !== 1 ? 's' : ''}
              </span>
            )}
            {onClick && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
