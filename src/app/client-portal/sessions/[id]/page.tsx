'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Clock,
  Users,
  BarChart3,
  LayoutList,
  Smile,
  Meh,
  Frown,
} from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'
import { useClientSessionDetail } from '@/hooks/queries/use-client-sessions'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { ClientSessionOverview } from './components/client-session-overview'
import { ClientSessionAnalysis } from './components/client-session-analysis'

export default function ClientSessionDetailPage() {
  const params = useParams()
  const sessionId = params.id as string

  const {
    data: sessionData,
    isLoading,
    error,
  } = useClientSessionDetail(sessionId)

  const { data: commitmentData, refetch: refetchCommitments } = useCommitments(
    { session_id: sessionId },
    { enabled: !!sessionId },
  )
  const structuredCommitments = commitmentData?.commitments ?? []

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-6 w-20" />
        </div>
        {/* Hero skeleton */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-56 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Skeleton className="h-14 w-16" />
              <Skeleton className="h-14 w-16" />
              <Skeleton className="h-14 w-16" />
            </div>
          </div>
        </div>
        {/* Tab skeleton */}
        <Skeleton className="h-10 w-64 mb-6" />
        {/* Content skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !sessionData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'Session not found'}
          </p>
          <Link href="/client-portal/sessions">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const session = sessionData.session
  const hasInsights = sessionData.insights != null
  const sentimentScore = sessionData.insights?.sentiment?.score
  const sentimentLabel = sessionData.insights?.sentiment?.overall

  const getSentimentIcon = () => {
    if (sentimentScore == null) return null
    if (sentimentScore >= 7)
      return <Smile className="h-4 w-4 text-emerald-500" />
    if (sentimentScore >= 4) return <Meh className="h-4 w-4 text-amber-500" />
    return <Frown className="h-4 w-4 text-gray-400" />
  }

  const getSentimentBgColor = () => {
    if (sentimentScore == null) return ''
    if (sentimentScore >= 7)
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (sentimentScore >= 4)
      return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/client-portal/sessions">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Sessions
          </Button>
        </Link>
        <Badge
          variant="secondary"
          className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize"
        >
          {session.status}
        </Badge>
      </div>

      {/* Hero Section */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Date & Title */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-gray-900 dark:bg-white rounded-xl flex flex-col items-center justify-center text-white dark:text-gray-900">
              <span className="text-2xl font-bold">
                {session.started_at ? formatDate(session.started_at, 'd') : '-'}
              </span>
              <span className="text-xs uppercase tracking-wide opacity-80">
                {session.started_at
                  ? formatDate(session.started_at, 'MMM')
                  : ''}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {session.started_at
                  ? formatDate(session.started_at, 'EEEE, MMMM d, yyyy')
                  : 'Session Details'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {session.started_at && formatRelativeTime(session.started_at)}
              </p>
              {session.is_group_session && (
                <Badge className="mt-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Group Session
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-5 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {session.duration_minutes || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Minutes
              </p>
            </div>
            <div className="h-10 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {session.key_topics?.length || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Topics</p>
            </div>
            <div className="h-10 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {structuredCommitments.length ||
                  session.action_items?.length ||
                  0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Commitments
              </p>
            </div>
            {/* Sentiment score chip */}
            {sentimentScore != null && (
              <>
                <div className="h-10 w-px bg-gray-200 dark:bg-gray-700" />
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getSentimentBgColor()}`}
                >
                  {getSentimentIcon()}
                  <div>
                    <p className="text-lg font-bold leading-none">
                      {sentimentScore.toFixed(1)}
                    </p>
                    <p className="text-xs capitalize opacity-80">
                      {sentimentLabel}
                    </p>
                  </div>
                </div>
              </>
            )}
            {/* Coach */}
            {session.coach && (
              <>
                <div className="h-10 w-px bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 font-medium">
                    {session.coach.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Coach
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.coach.name}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Processing Notice — only show if there's no content yet */}
      {session.status === 'processing' &&
        !session.summary &&
        !sessionData.transcript?.length &&
        !hasInsights && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center animate-pulse">
              <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Session Processing
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Details will appear once processing is complete.
              </p>
            </div>
          </div>
        )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutList className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="gap-2"
            disabled={!hasInsights}
          >
            <BarChart3 className="h-4 w-4" />
            Insights & Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ClientSessionOverview
            sessionData={sessionData}
            sessionId={sessionId}
            commitments={structuredCommitments}
            onRefetchCommitments={() => refetchCommitments()}
          />
        </TabsContent>

        <TabsContent value="analysis">
          <ClientSessionAnalysis sessionData={sessionData} />
        </TabsContent>
      </Tabs>

      {/* Empty State — only when session has absolutely no content */}
      {!session.summary &&
        (!session.action_items || session.action_items.length === 0) &&
        !sessionData.transcript?.length &&
        !sessionData.tasks?.length &&
        !hasInsights && (
          <div className="mt-6 text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Session details coming soon
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              This session is still being processed. Check back soon for the
              full summary, transcript, and insights.
            </p>
          </div>
        )}
    </div>
  )
}
