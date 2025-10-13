import { useState, useEffect } from 'react'
import { SessionService } from '@/services/session-service'
import { ApiClient } from '@/lib/api-client'

interface TranscriptEntry {
  id: string
  speaker: string
  text: string
  timestamp: string
  confidence: number | null
  created_at: string
}

interface CoachingAnalysis {
  id: string
  overall_score: number | null
  conversation_phase: string | null
  key_suggestions: string[] | null
  improvement_areas: string[] | null
  positive_feedback: string[] | null
  analysis_data: any
  created_at: string
}

interface MeetingSummary {
  id: string
  duration_minutes: number | null
  total_transcript_entries: number | null
  total_coaching_suggestions: number | null
  final_overall_score: number | null
  final_conversation_phase: string | null
  key_insights: string[] | null
  action_items: string[] | null
  meeting_summary: string | null
  created_at: string
}

interface SessionDetails {
  session: {
    id: string
    bot_id: string | null
    meeting_url: string | null
    status: string
    session_type?: string
    transcription_status?: string
    transcription_progress?: number
    created_at: string
    updated_at: string
    metadata: any
    client_id?: string
  }
  transcript: TranscriptEntry[]
  coaching_analyses: CoachingAnalysis[]
  meeting_summary: MeetingSummary | null
}

interface UseSessionDataReturn {
  sessionData: SessionDetails | null
  loading: boolean
  error: string | null
  generatingSummary: boolean
  generateSummary: () => Promise<void>
  refetch: () => Promise<void>
}

export function useSessionData(sessionId: string): UseSessionDataReturn {
  const [sessionData, setSessionData] = useState<SessionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)

  const fetchSessionDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch comprehensive session details
      const response = await SessionService.getSessionDetails(sessionId)

      // Set session data directly from the comprehensive response
      console.log('Session data received:', {
        transcriptCount: response.transcript?.length || 0,
        firstTranscript: response.transcript?.[0]?.text?.substring(0, 50),
        sessionId: response.session?.id,
        status: response.session?.status,
      })
      setSessionData(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const generateSummary = async () => {
    try {
      setGeneratingSummary(true)
      console.log('Starting summary generation for session:', sessionId)
      console.log('Session status:', sessionData?.session?.status)

      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const response = await ApiClient.post(
        `${BACKEND_URL}/sessions/${sessionId}/generate-summary`,
        {},
      )

      console.log('Summary generation response:', response)

      // Refresh session data to show new summary
      await fetchSessionDetails()

      // Show success message (you can add a toast notification here)
      console.log('Summary generated successfully')
      alert('Summary generated successfully!')
    } catch (err) {
      console.error('Failed to generate summary:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to generate summary: ${errorMessage}`)
    } finally {
      setGeneratingSummary(false)
    }
  }

  useEffect(() => {
    fetchSessionDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return {
    sessionData,
    loading,
    error,
    generatingSummary,
    generateSummary,
    refetch: fetchSessionDetails,
  }
}
