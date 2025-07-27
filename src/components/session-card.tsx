import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Clock,
  MessageSquare,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar,
  Globe,
  Video,
  Eye,
  Zap,
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
      case 'recording':
        return <Circle className="h-4 w-4 text-blue-600 animate-pulse" />
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
      case 'recording':
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

  const getPlatformIcon = (url: string) => {
    if (url.includes('zoom.us'))
      return <Video className="h-4 w-4 text-blue-600" />
    if (url.includes('meet.google.com'))
      return <Video className="h-4 w-4 text-green-600" />
    if (url.includes('teams.microsoft.com'))
      return <Video className="h-4 w-4 text-purple-600" />
    return <Globe className="h-4 w-4 text-gray-400" />
  }

  const getPlatformName = (url: string) => {
    if (url.includes('zoom.us')) return 'Zoom'
    if (url.includes('meet.google.com')) return 'Google Meet'
    if (url.includes('teams.microsoft.com')) return 'Microsoft Teams'
    return 'Web Meeting'
  }

  const getClientInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Extract client info from metadata
  const clientName = session.metadata?.client_name || null
  const hasTranscript =
    summary?.total_transcript_entries && summary.total_transcript_entries > 0

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-slate-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(session.status)}
            <div className="flex flex-col gap-1">
              <Badge
                className={`${getStatusColor(
                  session.status,
                )} text-xs font-medium w-fit`}
              >
                {session.status.replace('_', ' ')}
              </Badge>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Client Avatar and Info */}
          {clientName && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-slate-100">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-bold">
                  {getClientInitials(clientName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-900">
                  {clientName}
                </p>
                <p className="text-xs text-slate-500">Client</p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Platform & Meeting Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {getPlatformIcon(session.meeting_url)}
            <span className="font-medium text-slate-700">
              {getPlatformName(session.meeting_url)}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-xs truncate">
              {session.meeting_url.replace(/^https?:\/\//, '').split('/')[0]}
            </span>
          </div>

          {/* Bot ID for debugging */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>ID:</span>
            <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">
              {session.bot_id.slice(0, 8)}...
            </code>
          </div>
        </div>

        {/* Session Stats */}
        {summary ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {summary.duration_minutes && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">
                      {summary.duration_minutes}m
                    </p>
                    <p className="text-xs text-slate-500">Duration</p>
                  </div>
                </div>
              )}

              {summary.total_transcript_entries && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">
                      {summary.total_transcript_entries}
                    </p>
                    <p className="text-xs text-slate-500">Messages</p>
                  </div>
                </div>
              )}

              {summary.total_coaching_suggestions && (
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                  <Target className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="font-medium text-purple-900">
                      {summary.total_coaching_suggestions}
                    </p>
                    <p className="text-xs text-purple-600">AI Tips</p>
                  </div>
                </div>
              )}

              {summary.final_overall_score && (
                <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <div>
                    <p
                      className={`font-bold text-lg ${getScoreColor(
                        summary.final_overall_score,
                      )}`}
                    >
                      {summary.final_overall_score}/10
                    </p>
                    <p className="text-xs text-slate-500">Score</p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary or Key Insights */}
            {summary.meeting_summary && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 line-clamp-2 leading-relaxed">
                  {summary.meeting_summary}
                </p>
              </div>
            )}

            {summary.key_insights && summary.key_insights.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">
                      Key Insight
                    </p>
                    <p className="text-sm text-green-800 line-clamp-2">
                      {summary.key_insights[0]}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {hasTranscript ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <MessageSquare className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Transcript Available
                  </p>
                  <p className="text-xs text-yellow-600">Analysis pending</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <Circle className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Session Started
                  </p>
                  <p className="text-xs text-slate-500">
                    Waiting for transcript data
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        {onViewDetails && (
          <div className="pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(session.id)}
              className="w-full border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
