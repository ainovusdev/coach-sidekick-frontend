// This file is deprecated - debug endpoints have been removed from the backend
// Keep for reference only

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface DebugAnalysisData {
  session_id: string
  timestamp: string
  processing_time_ms: number
  transcript: {
    total_entries: number
    final_entries: number
    full_transcript: Array<{
      speaker: string
      text: string
      timestamp: string
      confidence: number
    }>
    window_size: number
    window_text: string
  }
  similar_conversations: {
    semantic: Array<{
      id: string
      date: string
      summary: string
      topics: string[]
      sentiment: string
      effectiveness: number
      similarity_score: number
      similarity_type: string
      relevance_reason: string
    }>
    topic_based: Array<{
      id: string
      date: string
      summary: string
      topics: string[]
      sentiment: string
      effectiveness: number
      similarity_score: number
      similarity_type: string
      relevance_reason: string
    }>
    search_metrics: {
      semantic_found: number
      topic_found: number
      topics_extracted: string[]
    }
  }
  suggestions: {
    window_suggestions: Array<{
      id: string
      content: string
      category: string
      rationale: string
      priority: string
      timing: string
      timestamp: string
    }>
    suggestion_count: number
    based_on_entries: number
  }
  analysis_state: {
    timestamp: string
    coaching_scores: Record<string, number>
    go_live_scores: Record<string, number>
    sentiment: {
      overall: string
      score: number
      emotions: string[]
      engagement: string
    }
    suggestions_count: number
  } | null
  meeting_state: {
    phase: string
    energy: string
    focus: string
    next_steps?: string
    error?: string
  }
  metadata: {
    redis_session_status: string
    client_id: string | null
    bot_id: string
    created_at: string
    updated_at: string
  }
}

// @deprecated - Use regular coaching service instead
export function useDebugAnalysis(sessionId: string, autoRefresh: boolean = false) {
  const [data, setData] = useState<DebugAnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchDebugData = useCallback(async () => {
    if (!sessionId) return

    setLoading(true)
    setError(null)

    try {
      // Get auth token from localStorage (using the backend auth system)
      let token = localStorage.getItem('auth_token')
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/debug/${sessionId}/full-analysis`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            window_size: 10,
            include_similar: true,
          },
        }
      )

      setData(response.data)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching debug data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch debug data')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  // Initial fetch
  useEffect(() => {
    fetchDebugData()
  }, [sessionId])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchDebugData()
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, fetchDebugData])

  return {
    data,
    loading,
    error,
    refresh: fetchDebugData,
    lastRefresh,
  }
}

// @deprecated - Use regular coaching service instead
export function useDebugSuggestions(sessionId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSuggestions = useCallback(
    async (windowSize: number = 10, suggestionType: string = 'all') => {
      if (!sessionId) return null

      setLoading(true)
      setError(null)

      try {
        // Get auth token from localStorage (using the backend auth system)
        const token = localStorage.getItem('auth_token')
        
        if (!token) {
          throw new Error('No authentication token found')
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/v1/debug/${sessionId}/generate-suggestions`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              window_size: windowSize,
              suggestion_type: suggestionType,
            },
          }
        )

        return response.data
      } catch (err) {
        console.error('Error generating suggestions:', err)
        setError(err instanceof Error ? err.message : 'Failed to generate suggestions')
        return null
      } finally {
        setLoading(false)
      }
    },
    [sessionId]
  )

  return {
    generateSuggestions,
    loading,
    error,
  }
}

// @deprecated - Use regular coaching service instead
export function useConversationAnalysis(sessionId: string) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeConversation = useCallback(async () => {
    if (!sessionId) return

    setLoading(true)
    setError(null)

    try {
      // Get auth token
      const authData = localStorage.getItem('supabase.auth.token')
      let token = null
      
      if (authData) {
        try {
          const parsed = JSON.parse(authData)
          token = parsed?.currentSession?.access_token || parsed?.access_token
        } catch {
          const tokenData = localStorage.getItem('auth_token')
          if (tokenData) {
            token = tokenData
          }
        }
      }

      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/debug/${sessionId}/conversation-analysis`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setData(response.data)
      return response.data
    } catch (err) {
      console.error('Error analyzing conversation:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze conversation')
      return null
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  return {
    data,
    analyzeConversation,
    loading,
    error,
  }
}