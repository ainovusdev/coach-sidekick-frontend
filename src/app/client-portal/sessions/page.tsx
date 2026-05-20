'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Clock,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  MessageSquare,
  Users,
  Flame,
  Timer,
  ArrowUpDown,
} from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'
import {
  useClientSessions,
  useClientDashboardStats,
} from '@/hooks/queries/use-client-sessions'

type SortOption = 'recent' | 'longest' | 'most_topics'

export default function ClientSessionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const itemsPerPage = 10

  const {
    data: sessions = [],
    isLoading,
    error,
    refetch,
  } = useClientSessions(currentPage, itemsPerPage)

  const { data: dashboardStats } = useClientDashboardStats()

  const formatSessionDate = (dateString: string) => {
    if (!dateString) return 'Date unavailable'
    return formatDate(dateString, 'EEEE, MMMM d, yyyy')
  }

  // Filter by search
  const filteredSessions = useMemo(() => {
    if (!searchTerm) return sessions
    const searchLower = searchTerm.toLowerCase()
    return sessions.filter(
      session =>
        session.summary?.toLowerCase().includes(searchLower) ||
        session.key_topics?.some(topic =>
          topic.toLowerCase().includes(searchLower),
        ) ||
        formatSessionDate(session.session_date)
          .toLowerCase()
          .includes(searchLower),
    )
  }, [sessions, searchTerm])

  // Sort
  const sortedSessions = useMemo(() => {
    const sorted = [...filteredSessions]
    switch (sortBy) {
      case 'longest':
        return sorted.sort(
          (a, b) => (b.duration_minutes || 0) - (a.duration_minutes || 0),
        )
      case 'most_topics':
        return sorted.sort(
          (a, b) => (b.key_topics?.length || 0) - (a.key_topics?.length || 0),
        )
      default:
        return sorted // API already returns most recent first
    }
  }, [filteredSessions, sortBy])

  const getSentimentColor = (score?: number) => {
    if (score == null) return null
    if (score >= 7) return 'bg-forest'
    if (score >= 4) return 'bg-amber-token'
    return 'bg-line'
  }

  const getSentimentLabel = (score?: number) => {
    if (score == null) return null
    if (score >= 7) return 'Positive'
    if (score >= 4) return 'Neutral'
    return 'Needs attention'
  }

  const getStatusBorder = (session: (typeof sessions)[0]) => {
    if (session.status === 'processing') return 'border-l-2 border-l-amber-400'
    return 'border-l-2 border-l-emerald-500'
  }

  // Stats from dashboard (accurate totals)
  const totalSessions = dashboardStats?.total_sessions ?? sessions.length
  const avgDuration = dashboardStats?.average_duration ?? 0
  const streakDays = dashboardStats?.streak_days ?? 0

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
          <div className="flex items-center gap-6">
            <Skeleton className="h-14 w-20" />
            <Skeleton className="h-14 w-20" />
            <Skeleton className="h-14 w-20" />
          </div>
        </div>
        {/* Search skeleton */}
        <Skeleton className="h-11 w-full mb-6" />
        {/* Card skeletons */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-stretch border border-line rounded-xl bg-surface-1 overflow-hidden"
            >
              <div className="w-24 md:w-32 bg-paper p-4 flex flex-col items-center justify-center border-r border-line ">
                <Skeleton className="h-8 w-10 mb-1" />
                <Skeleton className="h-3 w-14" />
              </div>
              <div className="flex-1 p-4 md:p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-20 rounded" />
                  <Skeleton className="h-5 w-14 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-vermillion mb-4">
            Error:{' '}
            {error instanceof Error ? error.message : 'Failed to load sessions'}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ink ">Your Sessions</h1>
          <p className="text-ink-3 mt-1">
            Review your coaching sessions and track your progress
          </p>
        </div>

        {/* Stats — from dashboard for accuracy */}
        <div className="flex items-center gap-6 md:gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-ink ">{totalSessions}</p>
            <p className="text-xs text-ink-3 ">Sessions</p>
          </div>
          <div className="h-8 w-px bg-surface-3 " />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Timer className="h-3.5 w-3.5 text-ink-4" />
              <p className="text-2xl font-bold text-ink ">{avgDuration}</p>
            </div>
            <p className="text-xs text-ink-3 ">Avg Min</p>
          </div>
          {streakDays > 0 && (
            <>
              <div className="h-8 w-px bg-surface-3 " />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-token" />
                  <p className="text-2xl font-bold text-ink ">{streakDays}</p>
                </div>
                <p className="text-xs text-ink-3 ">Week Streak</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-4 " />
          <Input
            type="text"
            placeholder="Search by date, topic, or summary..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-surface-1 border-line text-ink placeholder:text-ink-4 "
          />
        </div>
        <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[160px] h-11 bg-surface-1 border-line ">
            <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-ink-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="longest">Longest</SelectItem>
            <SelectItem value="most_topics">Most Topics</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions List */}
      {sortedSessions.length === 0 ? (
        <Card className="border-line ">
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-12 w-12 text-ink-2 mx-auto mb-4" />
            {searchTerm ? (
              <>
                <h3 className="font-medium text-ink mb-2">No sessions found</h3>
                <p className="text-sm text-ink-3 ">
                  No sessions matching &quot;{searchTerm}&quot;
                </p>
              </>
            ) : (
              <>
                <h3 className="font-medium text-ink mb-2">No sessions yet</h3>
                <p className="text-sm text-ink-3 ">
                  Your coaching sessions will appear here after your first call.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <TooltipProvider>
          <div className="space-y-3">
            {sortedSessions.map(session => {
              const sentimentColor = getSentimentColor(session.sentiment_score)
              const sentimentLabel = getSentimentLabel(session.sentiment_score)

              return (
                <Link
                  key={session.id}
                  href={`/client-portal/sessions/${session.id}`}
                  className="block group"
                >
                  <div
                    className={`flex items-stretch rounded-xl bg-surface-1 border border-line hover:border-line-strong hover:shadow-sm transition-all overflow-hidden ${getStatusBorder(session)}`}
                  >
                    {/* Date Column */}
                    <div className="w-24 md:w-32 flex-shrink-0 bg-paper p-4 flex flex-col items-center justify-center border-r border-line ">
                      <span className="text-2xl font-bold text-ink ">
                        {session.session_date
                          ? formatDate(session.session_date, 'd')
                          : '-'}
                      </span>
                      <span className="text-xs text-ink-3 uppercase tracking-wide">
                        {session.session_date
                          ? formatDate(session.session_date, 'MMM yyyy')
                          : ''}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 md:p-5 min-w-0">
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-medium text-ink ">
                            {session.session_date
                              ? formatDate(session.session_date, 'EEEE')
                              : 'Session'}
                          </span>
                          <span className="text-xs text-ink-4 ">
                            {formatRelativeTime(session.session_date)}
                          </span>
                          {/* Sentiment dot */}
                          {sentimentColor && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={`inline-block h-2.5 w-2.5 rounded-full ${sentimentColor}`}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {sentimentLabel} (
                                  {session.sentiment_score?.toFixed(1)}/10)
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge
                            variant="secondary"
                            className="bg-surface-3 text-ink-3 text-xs"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {session.duration_minutes || 0} min
                          </Badge>
                          {session.engagement_level && (
                            <Badge
                              variant="secondary"
                              className="bg-surface-3 text-ink-3 text-xs capitalize"
                            >
                              {session.engagement_level}
                            </Badge>
                          )}
                          {session.is_group_session && (
                            <Badge
                              variant="secondary"
                              className="bg-indigo-bg text-indigo text-xs"
                            >
                              <Users className="h-3 w-3 mr-1" />
                              Group
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      {session.summary ? (
                        <p className="text-sm text-ink-3 line-clamp-2 mb-3">
                          {session.summary}
                        </p>
                      ) : (
                        <p className="text-sm text-ink-4 italic mb-3">
                          No summary available
                        </p>
                      )}

                      {/* Bottom Row — Topics and Stats */}
                      <div className="flex items-center justify-between gap-4">
                        {/* Key Topics */}
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          {session.key_topics &&
                          session.key_topics.length > 0 ? (
                            <>
                              {session.key_topics
                                .slice(0, 3)
                                .map((topic, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex px-2.5 py-1 bg-surface-3 text-ink-3 text-xs rounded-md"
                                  >
                                    {topic}
                                  </span>
                                ))}
                              {session.key_topics.length > 3 && (
                                <span className="text-xs text-ink-4 ">
                                  +{session.key_topics.length - 3} more
                                </span>
                              )}
                            </>
                          ) : null}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-ink-3 flex-shrink-0">
                          {session.tasks_assigned > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" />
                              {session.tasks_assigned} commitments
                            </span>
                          )}
                          {session.action_items &&
                            session.action_items.length > 0 && (
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3.5 w-3.5" />
                                {session.action_items.length} actions
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center px-4 bg-paper border-l border-line group-hover:bg-surface-3 transition-colors">
                      <ArrowRight className="h-4 w-4 text-ink-4 group-hover:text-ink-3 transition-colors" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </TooltipProvider>
      )}

      {/* Pagination */}
      {sessions.length > 0 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-line ">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="text-ink-3 hover:text-ink "
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-ink-3 ">Page {currentPage}</span>

          <Button
            variant="ghost"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={sortedSessions.length < itemsPerPage}
            className="text-ink-3 hover:text-ink "
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
