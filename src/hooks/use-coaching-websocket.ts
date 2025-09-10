import { useEffect } from 'react'
import { useWebSocket } from '@/contexts/websocket-context'
import { CoachingSuggestion, CoachingAnalysis } from '@/services/coaching-service'

interface CoachingWebSocketEvents {
  onSuggestion?: (suggestion: CoachingSuggestion) => void
  onAnalysisUpdate?: (data: { analysisId: string; status: string; results?: any }) => void
  onAnalysisComplete?: (analysis: CoachingAnalysis) => void
  onMessage?: (message: any) => void
  onMeetingState?: (state: any) => void
  onSuggestionsUpdate?: (data: { suggestions: string[]; replace?: boolean }) => void
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
        events.onSuggestion?.(data.suggestion)
      }
    }

    const unsubscribe = on('coaching:suggestion', handler)
    return unsubscribe
  }, [botId, events.onSuggestion, on]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to coaching:analysis events
  useEffect(() => {
    if (!events.onAnalysisUpdate) return

    const handler = (data: any) => {
      if (data.botId === botId) {
        events.onAnalysisUpdate?.(data)
      }
    }

    const unsubscribe = on('coaching:analysis', handler)
    return unsubscribe
  }, [botId, events.onAnalysisUpdate, on]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to analysis:complete events
  useEffect(() => {
    if (!events.onAnalysisComplete) return

    const handler = (data: any) => {
      if (data.botId === botId || data.bot_id === botId) {
        events.onAnalysisComplete?.(data.analysis || data)
      }
    }

    const unsubscribe = on('analysis:complete', handler)
    return unsubscribe
  }, [botId, events.onAnalysisComplete, on]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to generic message events
  useEffect(() => {
    if (!events.onMessage) return

    const handler = (data: any) => {
      if (data.botId === botId || data.bot_id === botId) {
        events.onMessage?.(data)
      }
    }

    const unsubscribe = on('message', handler)
    return unsubscribe
  }, [botId, events.onMessage, on]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to meeting_state events
  useEffect(() => {
    if (!events.onMeetingState) return

    const handler = (data: any) => {
      // Meeting state is sent directly without botId wrapper
      events.onMeetingState?.(data)
    }

    const unsubscribe = on('meeting_state', handler)
    return unsubscribe
  }, [events.onMeetingState, on]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to suggestions_update events
  useEffect(() => {
    if (!events.onSuggestionsUpdate) return

    const handler = (data: any) => {
      events.onSuggestionsUpdate?.(data)
    }

    const unsubscribe = on('suggestions_update', handler)
    return unsubscribe
  }, [events.onSuggestionsUpdate, on]) // eslint-disable-line react-hooks/exhaustive-deps
}