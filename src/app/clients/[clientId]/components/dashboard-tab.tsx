import { Card, CardContent } from '@/components/ui/card'
import { Client, ClientSessionStats } from '@/types/meeting'
import { ClientSummaryCard } from './client-summary-card'
import { LastSessionCard } from './last-session-card'
import { ActiveCommitmentsCard } from './active-commitments-card'
import { Target, Sparkles } from 'lucide-react'

interface DashboardTabProps {
  client: Client
  sessions: any[] | null
  stats?: ClientSessionStats
  totalSessions: number
  onNavigateToGoals?: () => void
}

export function DashboardTab({
  client,
  sessions,
  stats,
  totalSessions,
  onNavigateToGoals,
}: DashboardTabProps) {
  return (
    <div className="space-y-6">
      {/* Meta Performance Vision - Prominent Display */}
      {client.meta_performance_vision && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  Meta Performance Vision
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {client.meta_performance_vision}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two-column layout for summary and last session */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientSummaryCard
          client={client}
          stats={stats}
          totalSessions={totalSessions}
        />
        <LastSessionCard sessions={sessions} clientName={client.name} />
      </div>

      {/* Active Commitments - Full Width */}
      <ActiveCommitmentsCard
        clientId={client.id}
        onViewAll={onNavigateToGoals}
      />

      {/* Quick Actions or Additional Info */}
      {!client.meta_performance_vision && (
        <Card className="border-gray-200 border-dashed bg-gray-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Target className="h-5 w-5 text-gray-400" />
              <p>
                <span className="font-medium text-gray-900">Tip:</span> Add a
                Meta Performance Vision to help guide coaching focus and track
                long-term outcomes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
