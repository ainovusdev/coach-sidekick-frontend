'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGroupSessions } from '@/hooks/queries/use-group-sessions'
import { StartGroupSessionModal } from './start-group-session-modal'
import { GroupSessionBadge } from '@/components/group-session/group-session-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Users, Clock, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ProgramGroupSessionsProps {
  programId: string
  members: Array<{
    client_id: string
    client_name: string
    client_email: string | null
  }>
  programName: string
}

export function ProgramGroupSessions({
  programId,
  members,
  programName,
}: ProgramGroupSessionsProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useGroupSessions({ program_id: programId })
  const sessions = data?.sessions ?? []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Group Sessions</h3>
        <Button
          onClick={() => setShowModal(true)}
          disabled={members.length < 2}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Start Group Session
        </Button>
      </div>

      {members.length < 2 && (
        <p className="text-sm text-muted-foreground">
          At least 2 program members are required to start a group session.
        </p>
      )}

      {/* Sessions List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No group sessions yet. Start one to coach multiple clients
              together.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <Card
              key={session.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/sessions/group/${session.id}`)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">
                        {session.title || 'Group Session'}
                      </h4>
                      <GroupSessionBadge count={session.participant_count} />
                      <Badge
                        variant={
                          session.status === 'active'
                            ? 'default'
                            : session.status === 'completed'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="text-xs"
                      >
                        {session.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(session.started_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {session.duration_seconds && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.round(session.duration_seconds / 60)} min
                        </span>
                      )}
                      <span>
                        {session.participants
                          .map(p => p.client_name)
                          .slice(0, 3)
                          .join(', ')}
                        {session.participants.length > 3 &&
                          ` +${session.participants.length - 3} more`}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Start Group Session Modal */}
      <StartGroupSessionModal
        open={showModal}
        onOpenChange={setShowModal}
        programId={programId}
        programName={programName}
        members={members}
      />
    </div>
  )
}
