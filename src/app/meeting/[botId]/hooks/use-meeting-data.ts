import { useState, useCallback } from 'react'
import { useBotData } from '@/hooks/use-bot-data'
import { useBotActions } from '@/hooks/use-bot-actions'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import { useBotWebSocket } from '@/hooks/use-bot-websocket'

interface UseMeetingDataProps {
  botId: string
}

interface SessionCompletedData {
  sessionId: string
  botId: string
  summary?: {
    transcript_count?: number
  }
  timestamp: string
}

interface BotStatusData {
  status: string
  timestamp: string
}

// Terminal bot statuses that indicate the meeting has ended
const TERMINAL_BOT_STATUSES = [
  'call_ended',
  'done',
  'error',
  'completed',
  'stopped',
]

export function useMeetingData({ botId }: UseMeetingDataProps) {
  const { bot, transcript, loading, error, sessionId, clientId, clientName } =
    useBotData(botId)
  const { stopBot, isLoading: isStoppingBot } = useBotActions()
  const [meetingState, setMeetingState] = useState<any>(null)
  const [isSessionCompleted, setIsSessionCompleted] = useState(false)
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(
    null,
  )

  // Handle meeting state updates
  const handleMeetingState = useCallback((data: any) => {
    console.log('[MeetingPage] Received meeting state:', data)
    setMeetingState(data)
  }, [])

  // Handle bot status change events
  // This provides immediate feedback when the call ends
  const handleBotStatus = useCallback((data: BotStatusData) => {
    console.log('[MeetingPage] Bot status changed:', data.status)

    // Check if this is a terminal status indicating the meeting ended
    if (TERMINAL_BOT_STATUSES.includes(data.status.toLowerCase())) {
      console.log(
        '[MeetingPage] Terminal bot status detected, marking session as completed',
      )
      setIsSessionCompleted(true)
      // Session ID will be set when session:completed event arrives
    }
  }, [])

  // Handle session completed event (sent after all processing is done)
  const handleSessionCompleted = useCallback((data: SessionCompletedData) => {
    console.log('[MeetingPage] Session completed event received:', data)
    setIsSessionCompleted(true)
    setCompletedSessionId(data.sessionId)
  }, [])

  // Subscribe to coaching WebSocket events
  useCoachingWebSocket(botId, {
    onMeetingState: handleMeetingState,
  })

  // Subscribe to bot WebSocket events
  // - onBotStatus: Immediate notification when call ends
  // - onSessionCompleted: Confirmation after processing is done
  useBotWebSocket(
    botId,
    {
      onBotStatus: handleBotStatus,
      onSessionCompleted: handleSessionCompleted,
    },
    bot,
  )

  return {
    bot,
    transcript,
    loading,
    error,
    meetingState,
    sessionId,
    clientId,
    clientName,
    stopBot,
    isStoppingBot,
    isSessionCompleted,
    completedSessionId,
  }
}
