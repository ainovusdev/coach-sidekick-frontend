import { useEffect } from 'react'
import { useWebSocket } from '@/contexts/websocket-context'
import { TranscriptEntry, Bot } from '@/types/meeting'

interface SessionCompletedData {
  sessionId: string
  botId: string
  summary?: {
    transcript_count?: number
  }
  timestamp: string
}

interface BotWebSocketEvents {
  onTranscriptNew?: (entry: TranscriptEntry) => void
  onTranscriptUpdate?: (data: {
    entryId: string
    updates: Partial<TranscriptEntry>
  }) => void
  onBotStatus?: (data: { status: string; timestamp: string }) => void
  onSessionCompleted?: (data: SessionCompletedData) => void
  onError?: (error: { code: string; message: string }) => void
}

/**
 * Hook for bot-specific WebSocket events
 * Automatically joins/leaves the bot room AFTER bot data is loaded
 */
export function useBotWebSocket(
  botId: string,
  events: BotWebSocketEvents,
  bot: Bot | null, // Add bot parameter to wait for data
) {
  const { joinRoom, leaveRoom, on, isConnected } = useWebSocket()

  // Join bot room ONLY when connected AND bot data is loaded
  useEffect(() => {
    // Wait for: WebSocket connected, botId exists, and bot data is fetched
    if (isConnected && botId && bot) {
      const roomName = `bot:${botId}`
      console.log(
        `[useBotWebSocket] Bot data loaded, WebSocket connected, joining room: ${roomName}`,
      )
      console.log(
        `[useBotWebSocket] Bot status: ${bot.status}, Platform: ${bot.platform}`,
      )

      // Small delay to ensure WebSocket is ready
      const joinTimer = setTimeout(() => {
        console.log(
          `[useBotWebSocket] Sending join message for room: ${roomName}`,
        )
        joinRoom(roomName)
      }, 300) // Small delay after bot data is available

      return () => {
        clearTimeout(joinTimer)
        console.log(`[useBotWebSocket] Cleanup - leaving room: ${roomName}`)
        leaveRoom(roomName)
      }
    } else {
      // Log why we're not joining yet
      if (!isConnected)
        console.log('[useBotWebSocket] Waiting for WebSocket connection...')
      if (!bot) console.log('[useBotWebSocket] Waiting for bot data to load...')
      if (!botId) console.log('[useBotWebSocket] No botId provided')
    }
  }, [isConnected, botId, bot, joinRoom, leaveRoom])

  // Subscribe to transcript:new events
  useEffect(() => {
    if (!events.onTranscriptNew) return

    const handler = (data: any) => {
      if (data.botId === botId) {
        events.onTranscriptNew?.(data.entry)
      }
    }

    const unsubscribe = on('transcript:new', handler)
    return unsubscribe
  }, [botId, events.onTranscriptNew, on]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to transcript:update events
  useEffect(() => {
    if (!events.onTranscriptUpdate) return

    const handler = (data: any) => {
      if (data.botId === botId) {
        events.onTranscriptUpdate?.(data)
      }
    }

    const unsubscribe = on('transcript:update', handler)
    return unsubscribe
  }, [botId, events.onTranscriptUpdate, on]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to bot:status events
  useEffect(() => {
    if (!events.onBotStatus) return

    const handler = (data: any) => {
      if (data.botId === botId) {
        events.onBotStatus?.(data)
      }
    }

    const unsubscribe = on('bot:status', handler)
    return unsubscribe
  }, [botId, events.onBotStatus, on]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to error events
  useEffect(() => {
    if (!events.onError) return

    const handler = (data: any) => {
      // Filter errors related to this bot
      if (data.context?.botId === botId || !data.context) {
        events.onError?.(data)
      }
    }

    const unsubscribe = on('error', handler)
    return unsubscribe
  }, [botId, events.onError, on]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to session:completed events
  useEffect(() => {
    if (!events.onSessionCompleted) return

    const handler = (data: SessionCompletedData) => {
      if (data.botId === botId) {
        console.log('[useBotWebSocket] Session completed event received:', data)
        events.onSessionCompleted?.(data)
      }
    }

    const unsubscribe = on('session:completed', handler)
    return unsubscribe
  }, [botId, events.onSessionCompleted, on]) // eslint-disable-line react-hooks/exhaustive-deps
}
