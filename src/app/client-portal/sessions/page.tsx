'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
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

  const isStrongScore = (score?: number) => score != null && score >= 7

  // Stats from dashboard (accurate totals)
  const totalSessions = dashboardStats?.total_sessions ?? sessions.length

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
        {/* Header skeleton */}
        <div className="mb-7">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        {/* Search skeleton */}
        <Skeleton className="h-11 w-full mb-4" />
        {/* Row skeletons */}
        <div className="border-t border-line">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-5 px-2 border-b border-line"
            >
              <Skeleton className="h-10 w-12" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
      {/* Header — editorial */}
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-tight leading-[1.2] text-ink m-0">
          Sessions
        </h1>
        <p className="text-[13px] text-ink-3 mt-1.5">
          {totalSessions > 0 ? (
            <>
              {totalSessions} conversation
              {totalSessions === 1 ? '' : 's'}
              {dashboardStats?.streak_days
                ? ` · ${dashboardStats.streak_days}-week streak`
                : ''}
            </>
          ) : (
            <>Your coaching sessions will appear here.</>
          )}
        </p>
      </div>

      {/* Search & Sort */}
      <div className="bg-surface-1 border border-line rounded-[10px] shadow-sm flex items-center gap-2 p-1.5 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-4" />
          <Input
            type="text"
            placeholder="Search by topic, date, or what was said…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-9 border-0 bg-transparent shadow-none text-[13px] text-ink placeholder:text-ink-4 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-auto h-8 border-0 bg-transparent shadow-none text-[12px] text-ink-2 px-2.5 gap-1.5 hover:bg-surface-3 focus:ring-0">
            <ArrowUpDown className="h-3.5 w-3.5 text-ink-4" />
            <span>
              Sort: <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="recent">recent</SelectItem>
            <SelectItem value="longest">longest</SelectItem>
            <SelectItem value="most_topics">most topics</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions List — editorial rows */}
      {sortedSessions.length === 0 ? (
        <div className="bg-surface-1 border border-line rounded-[10px] py-16 text-center">
          <MessageSquare className="h-10 w-10 text-ink-3 mx-auto mb-3" />
          {searchTerm ? (
            <>
              <h3 className="text-[14px] font-medium text-ink mb-1">
                No sessions found
              </h3>
              <p className="text-[13px] text-ink-3">
                No sessions matching &quot;{searchTerm}&quot;
              </p>
            </>
          ) : (
            <>
              <h3 className="text-[14px] font-medium text-ink mb-1">
                No sessions yet
              </h3>
              <p className="text-[13px] text-ink-3">
                Your coaching sessions will appear here after your first call.
              </p>
            </>
          )}
        </div>
      ) : (
        <TooltipProvider>
          <div className="border-t border-line">
            {sortedSessions.map(session => {
              const strong = isStrongScore(session.sentiment_score)
              const commitmentsCount =
                session.tasks_assigned || session.action_items?.length || 0
              return (
                <Link
                  key={session.id}
                  href={`/client-portal/sessions/${session.id}`}
                  className="group flex items-center gap-4 py-5 px-2 border-b border-line transition-colors hover:bg-surface-2"
                >
                  <div className="w-14 flex-shrink-0 flex flex-col items-center">
                    <span className="text-[24px] font-semibold leading-none text-ink">
                      {session.session_date
                        ? formatDate(session.session_date, 'd')
                        : '–'}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-ink-3 mt-1">
                      {session.session_date
                        ? formatDate(session.session_date, 'MMM')
                        : ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[14px] font-medium text-ink">
                        {session.session_date
                          ? formatDate(session.session_date, 'EEEE')
                          : 'Session'}
                      </span>
                      <span className="font-mono text-[11px] text-ink-3">
                        {session.duration_minutes || 0} min
                      </span>
                    </div>
                    <p className="m-0 text-[13px] leading-[1.5] text-ink-2 line-clamp-2">
                      {session.summary ?? (
                        <span className="italic text-ink-4">
                          No summary available
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 min-w-[100px]">
                    {strong && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 px-2 h-[22px] rounded-md bg-forest-bg text-forest text-[11px] font-medium">
                            <Sparkles className="h-3 w-3" />
                            Strong session
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {session.sentiment_score?.toFixed(1)}/10 sentiment
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {commitmentsCount > 0 && (
                      <span className="font-mono text-[11px] text-ink-3">
                        {commitmentsCount} commitment
                        {commitmentsCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-4 group-hover:text-ink-3 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </TooltipProvider>
      )}

      {/* Pagination */}
      {sessions.length > 0 && (
        <div className="flex items-center justify-between mt-6 pt-5">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="text-ink-3 hover:text-ink h-8 text-[12px]"
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Previous
          </Button>

          <span className="font-mono text-[12px] text-ink-3">
            Page {currentPage}
          </span>

          <Button
            variant="ghost"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={sortedSessions.length < itemsPerPage}
            className="text-ink-3 hover:text-ink h-8 text-[12px]"
          >
            Next
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
