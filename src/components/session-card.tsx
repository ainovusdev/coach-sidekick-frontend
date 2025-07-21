import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  MessageSquare,
  Target,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react'
import { MeetingSession } from '@/hooks/use-meeting-history'

interface SessionCardProps {
  session: MeetingSession
  onViewDetails?: (sessionId: string) => void
}

export function SessionCard({ session, onViewDetails }: SessionCardProps) {
  const summary = session.meeting_summaries
  const createdAt = new Date(session.created_at)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Circle className="h-4 w-4 text-blue-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(session.status)}
            <Badge className={getStatusColor(session.status)}>
              {session.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Meeting URL */}
        <div className="flex items-center gap-2 text-sm">
          <ExternalLink className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600 truncate">
            {session.meeting_url.replace(/^https?:\/\//, '')}
          </span>
        </div>

        {/* Session Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {summary.duration_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {summary.duration_minutes}m
                </span>
              </div>
            )}

            {summary.total_transcript_entries && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {summary.total_transcript_entries} msgs
                </span>
              </div>
            )}

            {summary.total_coaching_suggestions && (
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {summary.total_coaching_suggestions} tips
                </span>
              </div>
            )}

            {summary.final_overall_score && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span
                  className={`font-medium ${getScoreColor(
                    summary.final_overall_score,
                  )}`}
                >
                  {summary.final_overall_score}/10
                </span>
              </div>
            )}
          </div>
        )}

        {/* Summary or Key Insights */}
        {summary?.meeting_summary && (
          <div className="text-sm text-gray-700 line-clamp-2">
            {summary.meeting_summary}
          </div>
        )}

        {summary?.key_insights && summary.key_insights.length > 0 && (
          <div className="text-sm">
            <span className="text-gray-500">Key insight: </span>
            <span className="text-gray-700">{summary.key_insights[0]}</span>
          </div>
        )}

        {/* Action Button */}
        {onViewDetails && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(session.id)}
              className="w-full"
            >
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
