'use client'

import { ClientProfileSection } from './client-profile-section'
import { LastSessionInsightsCard } from './last-session-insights-card'
import { SprintKanbanSection } from './sprint-kanban-section'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useGoals } from '@/hooks/queries/use-goals'

interface OverviewTabProps {
  client: any
  sessions: any[] | null
  stats: any
  totalSessions: number
  avgDuration: number
  onEditClient: () => void
  onInviteClient: () => void
  onDeleteClient: () => void
  onCreateSprint: () => void
  onEndSprint?: (sprint: any) => void
  onEditCommitment?: (commitment: any) => void
  isViewer?: boolean
}

export function OverviewTab({
  client,
  sessions,
  stats,
  totalSessions,
  avgDuration,
  onEditClient,
  onInviteClient,
  onDeleteClient,
  onCreateSprint,
  onEndSprint,
  onEditCommitment,
  isViewer = false,
}: OverviewTabProps) {
  // Get last session
  const lastSession = sessions && sessions.length > 0 ? sessions[0] : null

  // Fetch commitments and goals for stats
  const { data: commitmentsData } = useCommitments({
    client_id: client.id,
  })

  const { data: goalsData } = useGoals(client.id)

  // Calculate stats
  const totalCommitments = commitmentsData?.commitments?.length || 0
  const completedCommitments =
    commitmentsData?.commitments?.filter((c: any) => c.status === 'completed')
      .length || 0

  const activeGoals =
    goalsData?.filter((g: any) => g.status === 'active').length || 0

  // Calculate average session score
  const avgScore =
    stats?.average_session_score !== null &&
    stats?.average_session_score !== undefined
      ? stats.average_session_score
      : null

  return (
    <div className="space-y-6">
      {/* Top Section: Client Profile and Last Session Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Client Profile */}
        <ClientProfileSection
          client={client}
          totalSessions={totalSessions}
          avgDuration={avgDuration}
          avgScore={avgScore}
          completedCommitments={completedCommitments}
          totalCommitments={totalCommitments}
          activeGoals={activeGoals}
          onEdit={onEditClient}
          onInvite={onInviteClient}
          onDelete={onDeleteClient}
          isViewer={isViewer}
        />

        {/* Right: Last Session Insights */}
        <LastSessionInsightsCard session={lastSession} />
      </div>

      {/* Sprint Kanban Section */}
      <SprintKanbanSection
        clientId={client.id}
        onCreateSprint={onCreateSprint}
        onEndSprint={onEndSprint}
        onCommitmentClick={onEditCommitment}
      />
    </div>
  )
}
