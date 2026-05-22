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
        <Card className="border-ds-accent  shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-ds-accent-bg rounded-full">
                <Sparkles className="h-6 w-6 text-ds-accent" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-ink mb-2 flex items-center gap-2">
                  Meta Performance Vision
                </h2>
                <p className="text-ink-2 leading-relaxed">
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
        <Card className="border-line border-dashed bg-paper/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-sm text-ink-3">
              <Target className="h-5 w-5 text-ink-4" />
              <p>
                <span className="font-medium text-ink">Tip:</span> Add a Meta
                Performance Vision to help guide coaching focus and track
                long-term outcomes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
