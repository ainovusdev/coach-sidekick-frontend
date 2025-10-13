import { useState, useEffect, useCallback } from 'react'
import { SessionService } from '@/services/session-service'

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
  coach_name?: string | null // NEW: Coach's name
}

interface MeetingHistoryResponse {
  meetings: MeetingSession[]
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

export function useMeetingHistory(limit: number = 10) {
  const [data, setData] = useState<MeetingHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(
    async (offset: number = 0) => {
      try {
        setLoading(true)
        setError(null)

        const page = Math.floor(offset / limit) + 1
        const response = await SessionService.listSessions({
          page,
          per_page: limit,
        })

        // Transform to expected format
        const historyData: MeetingHistoryResponse = {
          meetings: response.sessions.map((session: any) => ({
            id: session.id,
            bot_id: session.bot_id,
            meeting_url: session.meeting_url,
            status: session.status,
            created_at: session.created_at,
            updated_at: session.updated_at,
            metadata: session.client_id ? { client_id: session.client_id } : {},
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
            client_name: session.client_name || null, // FIXED: Use actual client_name from API
            coach_name: session.coach_name || null, // NEW: Use coach_name from API
          })),
          pagination: {
            limit,
            offset,
            hasMore: response.total > page * limit,
          },
        }

        setData(historyData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    },
    [limit],
  )

  useEffect(() => {
    fetchHistory()
  }, [limit, fetchHistory])

  return {
    data,
    loading,
    error,
    refetch: () => fetchHistory(),
    fetchMore: (offset: number) => fetchHistory(offset),
  }
}

export type { MeetingSession, MeetingSummary, MeetingHistoryResponse }
