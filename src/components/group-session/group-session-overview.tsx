'use client'

import { GroupSession } from '@/types/group-session'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface GroupSessionOverviewProps {
  session: GroupSession
}

export function GroupSessionOverview({ session }: GroupSessionOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            Participants
          </div>
          <p className="text-2xl font-bold">{session.participant_count}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            Duration
          </div>
          <p className="text-2xl font-bold">
            {session.duration_seconds
              ? `${Math.round(session.duration_seconds / 60)} min`
              : 'In progress'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            Started
          </div>
          <p className="text-lg font-medium">
            {format(new Date(session.started_at), 'MMM d, h:mm a')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            Status
          </div>
          <Badge
            variant={
              session.status === 'active'
                ? 'default'
                : session.status === 'completed'
                  ? 'secondary'
                  : 'outline'
            }
            className="text-sm"
          >
            {session.status}
          </Badge>
          {session.program_name && (
            <p className="text-xs text-muted-foreground mt-2">
              {session.program_name}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
