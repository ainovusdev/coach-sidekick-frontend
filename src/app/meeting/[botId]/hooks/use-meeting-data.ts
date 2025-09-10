import { useState, useCallback, useEffect } from 'react'
import { useBotData } from '@/hooks/use-bot-data'
import { useBotActions } from '@/hooks/use-bot-actions'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import { useWebSocket } from '@/contexts/websocket-context'

interface UseMeetingDataProps {
  botId: string
}

export function useMeetingData({ botId }: UseMeetingDataProps) {
  const { bot, transcript, loading, error } = useBotData(botId)
  const { stopBot, pauseBot, resumeBot, isLoading: isStoppingBot, isPaused } = useBotActions()
  const [meetingState, setMeetingState] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const { joinRoom, leaveRoom } = useWebSocket()

  // Join WebSocket room on mount
  useEffect(() => {
    console.log('[MeetingPage] Joining room:', `bot:${botId}`)
    joinRoom(`bot:${botId}`)
    
    return () => {
      console.log('[MeetingPage] Leaving room:', `bot:${botId}`)
      leaveRoom(`bot:${botId}`)
    }
  }, [botId, joinRoom, leaveRoom])

  // Handle meeting state updates
  const handleMeetingState = useCallback((data: any) => {
    console.log('[MeetingPage] Received meeting state:', data)
    setMeetingState(data)
  }, [])

  // Subscribe to WebSocket events
  useCoachingWebSocket(botId, {
    onMeetingState: handleMeetingState
  })

  return {
    bot,
    transcript,
    loading,
    error,
    meetingState,
    showDebug,
    setShowDebug,
    stopBot,
    pauseBot,
    resumeBot,
    isStoppingBot,
    isPaused
  }
}