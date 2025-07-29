import { useState, useEffect, useCallback } from 'react'
import { ApiClient } from '@/lib/api-client'

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

  const fetchHistory = useCallback(async (offset: number = 0) => {
    try {
      setLoading(true)
      setError(null)

      const response = await ApiClient.get(
        `/api/meetings/history?limit=${limit}&offset=${offset}`,
      )

      if (!response.ok) {
        throw new Error('Failed to fetch meeting history')
      }

      const historyData = await response.json()
      setData(historyData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [limit])

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
