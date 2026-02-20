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
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Client Summary
            </h2>
            <p className="text-sm text-gray-500">
              Overall insights and progress
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Total Sessions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Avg Score</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {avgScore ? avgScore.toFixed(1) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Last Session Date */}
        {lastSessionDate && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Last session:{' '}
              <span className="font-medium text-gray-900">
                {lastSessionDate}
              </span>
            </p>
          </div>
        )}

        {/* Coaching Focus Areas */}
        {focusAreas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900">
                Key Focus Areas
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {focusAreas.slice(0, 6).map((area, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-blue-50 border-blue-200 text-blue-700 text-xs"
                >
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes if available */}
        {client.notes && (
          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 line-clamp-3">{client.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
