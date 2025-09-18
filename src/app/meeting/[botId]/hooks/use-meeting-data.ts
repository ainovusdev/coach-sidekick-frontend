import { useState, useCallback } from 'react'
import { useBotData } from '@/hooks/use-bot-data'
import { useBotActions } from '@/hooks/use-bot-actions'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'

interface UseMeetingDataProps {
  botId: string
}

export function useMeetingData({ botId }: UseMeetingDataProps) {
  const { bot, transcript, loading, error } = useBotData(botId)
  const { stopBot, isLoading: isStoppingBot } = useBotActions()
  const [meetingState, setMeetingState] = useState<any>(null)

  // Room joining is handled by useBotWebSocket in use-bot-data.ts
  // No need to join again here

  // Handle meeting state updates
  const handleMeetingState = useCallback((data: any) => {
    console.log('[MeetingPage] Received meeting state:', data)
    setMeetingState(data)
  }, [])

  // Subscribe to WebSocket events
  useCoachingWebSocket(botId, {
    onMeetingState: handleMeetingState,
  })

  return {
    bot,
    transcript,
    loading,
    error,
    meetingState,
    stopBot,
    isStoppingBot,
  }
}
