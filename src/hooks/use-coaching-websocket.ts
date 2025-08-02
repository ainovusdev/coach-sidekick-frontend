import { useEffect } from 'react'
import { useWebSocket } from '@/contexts/websocket-context'
import { CoachingSuggestion, CoachingAnalysis } from '@/services/coaching-service'

interface CoachingWebSocketEvents {
  onSuggestion?: (suggestion: CoachingSuggestion) => void
  onAnalysisUpdate?: (data: { analysisId: string; status: string; results?: any }) => void
  onAnalysisComplete?: (analysis: CoachingAnalysis) => void
}

/**
 * Hook for coaching-specific WebSocket events
 */
export function useCoachingWebSocket(botId: string, events: CoachingWebSocketEvents) {
  const { on } = useWebSocket()

  // Subscribe to coaching:suggestion events
  useEffect(() => {
    if (!events.onSuggestion) return

    const handler = (data: any) => {
      if (data.botId === botId) {
        events.onSuggestion(data.suggestion)
      }
    }

    const unsubscribe = on('coaching:suggestion', handler)
    return unsubscribe
  }, [botId, events.onSuggestion, on])

  // Subscribe to coaching:analysis events
  useEffect(() => {
    if (!events.onAnalysisUpdate) return

    const handler = (data: any) => {
      if (data.botId === botId) {
        events.onAnalysisUpdate(data)
      }
    }

    const unsubscribe = on('coaching:analysis', handler)
    return unsubscribe
  }, [botId, events.onAnalysisUpdate, on])

  // Subscribe to analysis:complete events
  useEffect(() => {
    if (!events.onAnalysisComplete) return

    const handler = (data: any) => {
      if (data.botId === botId || data.bot_id === botId) {
        events.onAnalysisComplete(data.analysis || data)
      }
    }

    const unsubscribe = on('analysis:complete', handler)
    return unsubscribe
  }, [botId, events.onAnalysisComplete, on])
}