import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, Clock, TrendingUp, Activity } from 'lucide-react'

interface ClientStatsProps {
  stats: any
  avgDuration: number
  completedSessions: number
}

export default function ClientStats({
  stats,
  avgDuration,
  completedSessions,
}: ClientStatsProps) {
  if (!stats) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Total Sessions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_sessions}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Total Time
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_duration_minutes}m
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Avg Duration
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {avgDuration}m
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Completed
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedSessions}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Activity className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
