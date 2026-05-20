import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Client, ClientSessionStats } from '@/types/meeting'
import { User, TrendingUp, Target, MessageSquare } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

interface ClientSummaryCardProps {
  client: Client
  stats?: ClientSessionStats
  totalSessions: number
}

export function ClientSummaryCard({
  client,
  stats,
  totalSessions,
}: ClientSummaryCardProps) {
  const focusAreas = stats?.coaching_focus_areas || []
  const avgScore = stats?.average_overall_score
  const lastSessionDate = stats?.last_session_date
    ? formatDate(stats.last_session_date, 'MMM d, yyyy')
    : null

  return (
    <Card className="border-line shadow-sm">
      <CardHeader className="border-b border-line">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-ds-accent-bg rounded-lg">
            <User className="h-5 w-5 text-ds-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">Client Summary</h2>
            <p className="text-sm text-ink-3">Overall insights and progress</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-paper rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-ink-3" />
              <span className="text-sm text-ink-3">Total Sessions</span>
            </div>
            <p className="text-2xl font-bold text-ink">{totalSessions}</p>
          </div>
          <div className="p-4 bg-paper rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-ink-3" />
              <span className="text-sm text-ink-3">Avg Score</span>
            </div>
            <p className="text-2xl font-bold text-ink">
              {avgScore ? avgScore.toFixed(1) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Last Session Date */}
        {lastSessionDate && (
          <div className="pt-2 border-t border-line">
            <p className="text-sm text-ink-3">
              Last session:{' '}
              <span className="font-medium text-ink">{lastSessionDate}</span>
            </p>
          </div>
        )}

        {/* Coaching Focus Areas */}
        {focusAreas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-ink-3" />
              <h3 className="text-sm font-medium text-ink">Key Focus Areas</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {focusAreas.slice(0, 6).map((area, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-ds-accent-bg border-ds-accent text-ds-accent text-xs"
                >
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes if available */}
        {client.notes && (
          <div className="pt-2 border-t border-line">
            <h3 className="text-sm font-medium text-ink mb-2">Notes</h3>
            <p className="text-sm text-ink-3 line-clamp-3">{client.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
