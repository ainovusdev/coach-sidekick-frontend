import { StatCard } from '@/components/ui/stat-card'
import {
  Calendar,
  History,
  CheckCircle2,
  Clock,
  Target,
  Users,
} from 'lucide-react'

interface SessionStatsProps {
  totalSessions: number
  completedSessions: number
  inProgressSessions: number
  avgScore: number
  totalClients: number
  selectedClientName?: string
}

export default function SessionStats({
  totalSessions,
  completedSessions,
  inProgressSessions,
  avgScore,
  totalClients,
  selectedClientName,
}: SessionStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title={selectedClientName ? `${selectedClientName}'s Sessions` : 'Total Sessions'}
        value={totalSessions}
        icon={Calendar}
        variant="blue"
        footer={
          <>
            <History className="h-3 w-3 mr-1" />
            <span className="font-medium">All time</span>
          </>
        }
      />

      <StatCard
        title="Completed"
        value={completedSessions}
        icon={CheckCircle2}
        variant="green"
        footer={
          <>
            <Clock className="h-3 w-3 mr-1" />
            <span className="font-medium">
              {inProgressSessions > 0
                ? `${inProgressSessions} in progress`
                : 'Ready for new'}
            </span>
          </>
        }
      />

      <StatCard
        title="Average Score"
        value={avgScore > 0 ? avgScore : '—'}
        icon={Target}
        variant="purple"
        footer={
          <>
            <Target className="h-3 w-3 mr-1" />
            <span className="font-medium">Performance</span>
          </>
        }
      />

      <StatCard
        title="Active Clients"
        value={totalClients}
        icon={Users}
        variant="orange"
        footer={
          <>
            <Users className="h-3 w-3 mr-1" />
            <span className="font-medium">Coaching</span>
          </>
        }
      />
    </div>
  )
}