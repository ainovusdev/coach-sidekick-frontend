import { useMemo } from 'react'
import { useSessions } from '@/hooks/queries/use-sessions'

interface MeetingSummary {
  duration_minutes: number | null
  total_transcript_entries: number | null
  total_coaching_suggestions: number | null
  final_overall_score: number | null
  final_conversation_phase: string | null
  key_insights: string[] | null
  action_items: string[] | null
  meeting_summary: string | null
}

interface MeetingSession {
  id: string
  bot_id: string
  meeting_url: string
  status: string
  created_at: string
  updated_at: string
  metadata: any
  meeting_summaries: MeetingSummary | null
  summary?: string | null
  duration_seconds?: number | null
  client_name?: string | null
  coach_name?: string | null
  title?: string | null
}

interface MeetingHistoryResponse {
  meetings: MeetingSession[]
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface MeetingHistoryFilters {
  client_id?: string | null
  coach_id?: string | null
  page?: number
}

/**
 * Hook to fetch meeting/session history with pagination and filtering
 * Now powered by TanStack Query for automatic caching
 *
 * Benefits:
 * - Sessions cached and shown instantly if recently visited
 * - Automatic background refresh
 * - No duplicate requests across components
 * - Server-side filtering by client and coach
 */
export function useMeetingHistory(
  limit: number = 10,
  filters?: MeetingHistoryFilters,
) {
  // Use TanStack Query for sessions data with filters
  const {
    data: sessionsData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useSessions({
    page: filters?.page || 1,
    per_page: limit,
    ...(filters?.client_id && { client_id: filters.client_id }),
    ...(filters?.coach_id && { coach_id: filters.coach_id }),
  })

  // Transform sessions data to expected format
  const data: MeetingHistoryResponse | null = useMemo(() => {
    if (!sessionsData) return null

    return {
      meetings: sessionsData.sessions.map((session: any) => ({
        id: session.id,
        bot_id: session.bot_id,
        meeting_url: session.meeting_url,
        status: session.status,
        created_at: session.created_at,
        updated_at: session.updated_at,
        metadata: {
          ...(session.client_id && { client_id: session.client_id }),
          ...(session.coach_id && { coach_id: session.coach_id }),
          ...(session.coach_name && { coach_name: session.coach_name }),
        },
        meeting_summaries: session.summary
          ? {
              duration_minutes: session.duration_seconds
                ? Math.ceil(session.duration_seconds / 60)
                : null,
              total_transcript_entries: null,
              total_coaching_suggestions: null,
              final_overall_score: null,
              final_conversation_phase: null,
              key_insights: session.key_topics || null,
              action_items: session.action_items || null,
              meeting_summary: session.summary,
            }
          : null,
        summary: session.summary || null,
        duration_seconds: session.duration_seconds || null,
        client_name: session.client_name || null,
        coach_name: session.coach_name || null,
        title: session.title || null,
      })),
      pagination: {
        limit,
        offset: 0,
        hasMore: sessionsData.total > limit,
      },
    }
  }, [sessionsData, limit])

  const error = queryError ? 'Failed to load sessions' : null

  // Fetch more function for pagination
  const fetchMore = (_offset: number) => {
    // For now, just refetch - can be enhanced with proper pagination later
    // TODO: Implement proper pagination with useInfiniteQuery
    refetch()
  }

  return {
    data,
    loading,
    error,
    refetch,
    fetchMore,
  }
}

export type { MeetingSession, MeetingSummary, MeetingHistoryResponse }
