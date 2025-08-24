import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, Activity } from 'lucide-react'
import { ClientSessionStats } from '@/types/meeting'

interface ClientStatsProps {
  stats: ClientSessionStats
}

export default function ClientStats({ stats }: ClientStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <Card className="border-neutral-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <Calendar className="h-4 w-4 text-neutral-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-neutral-900">
                {stats.total_sessions}
              </p>
              <p className="text-xs text-neutral-500">
                Total Sessions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-neutral-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <Clock className="h-4 w-4 text-neutral-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-neutral-900">
                {stats.total_duration_minutes}
              </p>
              <p className="text-xs text-neutral-500">
                Total Minutes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats.average_overall_score && (
        <Card className="border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-100 rounded-lg">
                <Activity className="h-4 w-4 text-neutral-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-neutral-900">
                  {stats.average_overall_score.toFixed(1)}
                </p>
                <p className="text-xs text-neutral-500">
                  Average Score
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}