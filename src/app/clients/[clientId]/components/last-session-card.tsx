'use client'

import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSessionDetails } from '@/hooks/queries/use-session-details'
import { useCommitments } from '@/hooks/queries/use-commitments'
import {
  Calendar,
  Clock,
  MessageSquare,
  ArrowRight,
  FileText,
  Target,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface LastSessionCardProps {
  sessions: any[] | null
  clientName: string
}

export function LastSessionCard({
  sessions,
  clientName,
}: LastSessionCardProps) {
  const router = useRouter()

  // Get the most recent session
  const lastSession = sessions && sessions.length > 0 ? sessions[0] : null

  // Fetch full session details
  const { data: sessionDetails, isLoading } = useSessionDetails(lastSession?.id)

  // Fetch commitments from this session
  const { data: commitmentsData } = useCommitments(
    { session_id: lastSession?.id },
    { enabled: !!lastSession?.id },
  )

  const commitments = commitmentsData?.commitments || []
  const activeCommitments = commitments.filter(c => c.status === 'active')

  if (!lastSession) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Last Session
              </h2>
              <p className="text-sm text-gray-500">Most recent coaching call</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-900 font-medium mb-1">No sessions yet</h3>
            <p className="text-sm text-gray-500">
              Record your first session with {clientName} to see details here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    )
  }

  const sessionDate = new Date(lastSession.created_at).toLocaleDateString(
    'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  )

  const summary = sessionDetails?.meeting_summary
  const insights = sessionDetails?.analyses?.insights

  const duration = summary?.duration_minutes
    ? `${summary.duration_minutes} min`
    : null

  const score = summary?.final_overall_score

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Last Session
              </h2>
              <p className="text-sm text-gray-500">Most recent coaching call</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/sessions/${lastSession.id}`)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            View Details
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Session Metadata */}
        <div className="flex items-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{sessionDate}</span>
          </div>
          {duration && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
          )}
          {score !== undefined && score !== null && (
            <Badge
              variant="outline"
              className={cn(
                'bg-green-50 border-green-200 text-green-700',
                score < 6 && 'bg-yellow-50 border-yellow-200 text-yellow-700',
                score < 4 && 'bg-red-50 border-red-200 text-red-700',
              )}
            >
              Score: {score.toFixed(1)}
            </Badge>
          )}
        </div>

        {/* Session Summary */}
        {summary?.meeting_summary && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900">Summary</h3>
            </div>
            <p className="text-sm text-gray-600 line-clamp-3">
              {summary.meeting_summary}
            </p>
          </div>
        )}

        {/* Key Topics/Insights */}
        {insights?.key_topics && insights.key_topics.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900">Key Topics</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {insights.key_topics
                .slice(0, 4)
                .map((topic: string, idx: number) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-gray-50 border-gray-200 text-gray-700 text-xs"
                  >
                    {topic}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Commitments from this session */}
        {activeCommitments.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900">
                Commitments Made
              </h3>
              <Badge variant="secondary" className="text-xs">
                {activeCommitments.length}
              </Badge>
            </div>
            <ul className="space-y-1">
              {activeCommitments.slice(0, 3).map(commitment => (
                <li
                  key={commitment.id}
                  className="text-sm text-gray-600 flex items-start gap-2"
                >
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="line-clamp-1">{commitment.title}</span>
                </li>
              ))}
            </ul>
            {activeCommitments.length > 3 && (
              <p className="text-xs text-gray-500 mt-1">
                +{activeCommitments.length - 3} more
              </p>
            )}
          </div>
        )}

        {/* Status Badge */}
        <div className="pt-2 border-t border-gray-100">
          <Badge
            variant="outline"
            className={cn(
              'bg-gray-50 border-gray-200 text-gray-700',
              lastSession.status === 'completed' &&
                'bg-green-50 border-green-200 text-green-700',
              lastSession.status === 'in_progress' &&
                'bg-blue-50 border-blue-200 text-blue-700',
            )}
          >
            {lastSession.status === 'completed'
              ? 'Completed'
              : lastSession.status === 'in_progress'
                ? 'In Progress'
                : lastSession.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
