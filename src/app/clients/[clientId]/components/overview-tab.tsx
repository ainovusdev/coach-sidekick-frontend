'use client'

import { useState, useMemo } from 'react'
import { ClientProfileSection } from './client-profile-section'
import { LastSessionInsightsCard } from './last-session-insights-card'
import { SprintKanbanBoard } from '@/components/sprints/sprint-kanban-board'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useGoals } from '@/hooks/queries/use-goals'
import { useTargets } from '@/hooks/queries/use-targets'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Plus,
  User,
  Briefcase,
  Users,
  BookOpen,
  ArrowRight,
  Share2,
} from 'lucide-react'
import { useResources } from '@/hooks/queries/use-resources'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/resource'

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
  onViewResources?: () => void
  onShareResource?: () => void
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
  onViewResources,
  onShareResource,
  isViewer = false,
}: OverviewTabProps) {
  // Get last session
  const lastSession = sessions && sessions.length > 0 ? sessions[0] : null

  const queryClient = useQueryClient()

  // Filter state for commitments
  const [commitmentFilter, setCommitmentFilter] = useState<
    'all' | 'client' | 'coach'
  >('all')

  // Fetch commitments, goals, and targets for stats and kanban
  const { data: commitmentsData } = useCommitments({
    client_id: client.id,
  })

  const { data: goalsData } = useGoals(client.id)
  const { data: allTargets = [] } = useTargets()

  // Fetch client-specific resources for the compact card
  const { data: clientResourcesData } = useResources({
    scope: 'client',
    client_id: client.id,
    limit: 3,
  })

  // Filter targets by client's goals
  const clientTargets = allTargets.filter((t: any) =>
    goalsData?.some((g: any) => t.goal_ids?.includes(g.id)),
  )

  // Filter commitments based on selection
  const filteredCommitments = useMemo(() => {
    const all = commitmentsData?.commitments || []
    if (commitmentFilter === 'client') {
      return all.filter((c: any) => !c.is_coach_commitment)
    }
    if (commitmentFilter === 'coach') {
      return all.filter((c: any) => c.is_coach_commitment)
    }
    return all
  }, [commitmentsData?.commitments, commitmentFilter])

  // Calculate stats (always from all commitments, not filtered)
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
            <div className="flex items-center gap-2">
              {/* Filter Buttons */}
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button
                  variant={commitmentFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCommitmentFilter('all')}
                  className="rounded-none border-0"
                >
                  <Users className="h-3 w-3 mr-1" />
                  All
                </Button>
                <Button
                  variant={commitmentFilter === 'client' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCommitmentFilter('client')}
                  className="rounded-none border-0"
                >
                  <User className="h-3 w-3 mr-1" />
                  Client
                </Button>
                <Button
                  variant={commitmentFilter === 'coach' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCommitmentFilter('coach')}
                  className="rounded-none border-0"
                >
                  <Briefcase className="h-3 w-3 mr-1" />
                  My Tasks
                </Button>
              </div>
              {!isViewer && onCreateCommitment && (
                <Button
                  onClick={onCreateCommitment}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Commitment
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCommitments.length > 0 ? (
            <SprintKanbanBoard
              commitments={filteredCommitments}
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

      {/* Shared Resources Compact Card */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gray-700" />
              <CardTitle className="text-lg font-semibold">
                Shared Resources ({clientResourcesData?.total || 0})
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!isViewer && onShareResource && (
                <Button onClick={onShareResource} variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Resource
                </Button>
              )}
              {onViewResources && (
                <Button onClick={onViewResources} variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(clientResourcesData?.resources?.length || 0) > 0 ? (
            <div className="space-y-2">
              {clientResourcesData!.resources.slice(0, 3).map(resource => {
                const colors =
                  CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.general
                return (
                  <div
                    key={resource.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {resource.title}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] shrink-0 ${colors.bg} ${colors.text} border-0`}
                    >
                      {CATEGORY_LABELS[resource.category]}
                    </Badge>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(resource.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No resources shared with {client.name} yet
              </p>
              {!isViewer && onShareResource && (
                <Button
                  onClick={onShareResource}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share a Resource
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
