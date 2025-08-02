import { useEffect, useCallback } from 'react'
import { useWebSocket } from '@/contexts/websocket-context'
import { TranscriptEntry } from '@/types/meeting'

interface BotWebSocketEvents {
  onTranscriptNew?: (entry: TranscriptEntry) => void
  onTranscriptUpdate?: (data: { entryId: string; updates: Partial<TranscriptEntry> }) => void
  onBotStatus?: (data: { status: string; timestamp: string }) => void
  onError?: (error: { code: string; message: string }) => void
}

/**
 * Hook for bot-specific WebSocket events
 * Automatically joins/leaves the bot room
 */
export function useBotWebSocket(botId: string, events: BotWebSocketEvents) {
  const { joinRoom, leaveRoom, on, isConnected } = useWebSocket()

  // Join bot room when connected
  useEffect(() => {
    if (isConnected && botId) {
      console.log(`[WebSocket] Joining bot room: bot:${botId}`)
      joinRoom(`bot:${botId}`)

      return () => {
        console.log(`[WebSocket] Leaving bot room: bot:${botId}`)
        leaveRoom(`bot:${botId}`)
      }
    }
  }, [isConnected, botId, joinRoom, leaveRoom])

  // Subscribe to transcript:new events
  useEffect(() => {
    if (!events.onTranscriptNew) return

    const handler = (data: any) => {
      if (data.botId === botId) {
        events.onTranscriptNew(data.entry)
      }
    }

    const unsubscribe = on('transcript:new', handler)
    return unsubscribe
  }, [botId, events.onTranscriptNew, on])

  // Subscribe to transcript:update events
  useEffect(() => {
    if (!events.onTranscriptUpdate) return

    const handler = (data: any) => {
      if (data.botId === botId) {
        events.onTranscriptUpdate(data)
      }
    }

    const unsubscribe = on('transcript:update', handler)
    return unsubscribe
  }, [botId, events.onTranscriptUpdate, on])

  // Subscribe to bot:status events
  useEffect(() => {
    if (!events.onBotStatus) return

    const handler = (data: any) => {
      if (data.botId === botId) {
        events.onBotStatus(data)
      }
    }

    const unsubscribe = on('bot:status', handler)
    return unsubscribe
  }, [botId, events.onBotStatus, on])

  // Subscribe to error events
  useEffect(() => {
    if (!events.onError) return

    const handler = (data: any) => {
      // Filter errors related to this bot
      if (data.context?.botId === botId || !data.context) {
        events.onError(data)
      }
    }

    const unsubscribe = on('error', handler)
    return unsubscribe
  }, [botId, events.onError, on])
}