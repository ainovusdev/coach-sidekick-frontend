'use client'

import { ClientProfileSection } from './client-profile-section'
import { LastSessionInsightsCard } from './last-session-insights-card'
import { SprintKanbanBoard } from '@/components/sprints/sprint-kanban-board'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useGoals } from '@/hooks/queries/use-goals'
import { useTargets } from '@/hooks/queries/use-targets'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface OverviewTabProps {
  client: any
  sessions: any[] | null
  stats: any
  totalSessions: number
  avgDuration: number
  onEditClient: () => void
  onInviteClient: () => void
  onDeleteClient: () => void
  onCreateCommitment?: () => void
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
  onCreateCommitment,
  onEditCommitment,
  isViewer = false,
}: OverviewTabProps) {
  // Get last session
  const lastSession = sessions && sessions.length > 0 ? sessions[0] : null

  const queryClient = useQueryClient()

  // Fetch commitments, goals, and targets for stats and kanban
  const { data: commitmentsData } = useCommitments({
    client_id: client.id,
  })

  const { data: goalsData } = useGoals(client.id)
  const { data: allTargets = [] } = useTargets()

  // Filter targets by client's goals
  const clientTargets = allTargets.filter((t: any) =>
    goalsData?.some((g: any) => t.goal_ids?.includes(g.id)),
  )

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

  const handleCommitmentUpdate = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.commitments.all,
    })
    queryClient.invalidateQueries({
      queryKey: queryKeys.targets.all,
    })
  }

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

      {/* Simple Commitments Kanban Board */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Commitments ({totalCommitments})
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Track all commitments across outcomes and sprints
              </p>
            </div>
            {!isViewer && onCreateCommitment && (
              <Button onClick={onCreateCommitment} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Commitment
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {commitmentsData?.commitments &&
          commitmentsData.commitments.length > 0 ? (
            <SprintKanbanBoard
              commitments={commitmentsData.commitments}
              clientId={client.id}
              targets={clientTargets}
              onCommitmentClick={onEditCommitment}
              onCommitmentUpdate={handleCommitmentUpdate}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              {!isViewer && onCreateCommitment && (
                <Button onClick={onCreateCommitment} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Commitment
                </Button>
              )}
              {isViewer && (
                <p className="text-sm text-gray-500">No commitments yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
