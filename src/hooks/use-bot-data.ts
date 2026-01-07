import { useState, useEffect, useCallback, useRef } from 'react'
import { Bot, TranscriptEntry } from '@/types/meeting'
import { SessionService } from '@/services/session-service'
import { MeetingService } from '@/services/meeting-service'
import { useBotWebSocket } from '@/hooks/use-bot-websocket'
import { useWebSocket } from '@/contexts/websocket-context'

interface UseBotDataReturn {
  bot: Bot | null
  transcript: TranscriptEntry[]
  loading: boolean
  error: string | null
  sessionId: string | null
  clientId: string | null
  clientName: string | null
  refetch: () => Promise<void>
}

const REFRESH_INTERVAL = 30000 // 30 seconds as fallback when WebSocket is disconnected

export function useBotData(botId: string): UseBotDataReturn {
  const [bot, setBot] = useState<Bot | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const transcriptMapRef = useRef<Map<string, TranscriptEntry>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientName, setClientName] = useState<string | null>(null)
  const { isConnected } = useWebSocket()

  const ensureSession = useCallback(async (botData: Bot) => {
    try {
      // First check if a session already exists for this bot
      try {
        const existingSession = await SessionService.getSessionByBotId(
          botData.id,
        )
        if (existingSession) {
          console.log('Session already exists for bot:', botData.id)
          setSessionId(existingSession.id)
          setClientId(existingSession.client_id || null)
          setClientName(existingSession.client?.name || null)
          return existingSession.id
        }
      } catch (error) {
        console.log('error', error)
        // Session doesn't exist, continue to create one
      }

      // Only create a new session if one doesn't exist
      const newSession = await SessionService.createSession({
        bot_id: botData.id,
        meeting_url: botData.meeting_url,
        session_metadata: {
          status: botData.status,
          platform: botData.platform,
          meeting_id: botData.meeting_id,
        },
      })
      console.log('Created new session for bot:', botData.id)
      setSessionId(newSession.id)
      setClientId(newSession.client_id || null)
      setClientName(newSession.client?.name || null)
      return newSession.id
    } catch (error) {
      console.warn('Failed to ensure session exists:', error)
      // Don't fail the whole process if session creation fails
      return null
    }
  }, [])

  const fetchBotData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch bot info and transcript from backend
      const [botInfo, transcriptData] = await Promise.all([
        MeetingService.getBotInfo(botId),
        MeetingService.getRealTimeTranscript(botId),
      ])

      if (botInfo) {
        const normalizedBot: Bot = {
          id: botInfo.id,
          status: botInfo.status,
          meeting_url: botInfo.meeting_url || '#',
          platform: botInfo.platform || 'unknown',
          meeting_id: botInfo.meeting_id,
        }
        setBot(normalizedBot)

        // Always try to get/create session for any bot
        // This ensures notes and commitments work for both live and completed sessions
        await ensureSession(normalizedBot)
      }

      if (transcriptData && transcriptData.transcripts) {
        // Initialize transcript map
        transcriptMapRef.current.clear()
        const normalizedTranscripts = transcriptData.transcripts.map(
          (entry: any) => ({
            ...entry,
            confidence: entry.confidence ?? 1.0, // Add default confidence if missing
          }),
        )
        normalizedTranscripts.forEach((entry: any) => {
          if (entry.id) {
            transcriptMapRef.current.set(entry.id, entry)
          }
        })
        setTranscript(normalizedTranscripts)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching bot data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bot data')
      setLoading(false)
    }
  }, [botId, ensureSession])

  // WebSocket event handlers
  const handleTranscriptNew = useCallback((entry: TranscriptEntry) => {
    console.log('[WebSocket] New transcript entry:', entry)

    // Add to transcript map
    if ((entry as any).id) {
      transcriptMapRef.current.set((entry as any).id, entry)
    }

    // Update transcript array
    setTranscript(prev => [...prev, entry])
  }, [])

  const handleTranscriptUpdate = useCallback(
    (data: { entryId: string; updates: Partial<TranscriptEntry> }) => {
      console.log('[WebSocket] Transcript update:', data)

      // Update in map
      const existing = transcriptMapRef.current.get(data.entryId)
      if (existing) {
        const updated = { ...existing, ...data.updates }
        transcriptMapRef.current.set(data.entryId, updated)

        // Update transcript array
        setTranscript(prev =>
          prev.map(entry =>
            (entry as any).id === data.entryId ? updated : entry,
          ),
        )
      }
    },
    [],
  )

  const handleBotStatus = useCallback(
    (data: { status: string; timestamp: string }) => {
      console.log('[WebSocket] Bot status update:', data)

      setBot(prev => {
        if (!prev) return null
        return {
          ...prev,
          status: data.status,
        }
      })
    },
    [],
  )

  const handleError = useCallback(
    (error: { code: string; message: string }) => {
      console.error('[WebSocket] Bot error:', error)
      setError(error.message)
    },
    [],
  )

  // Use WebSocket events - only join room after bot data is loaded
  // Pass bot to ensure room is only joined when bot exists
  useBotWebSocket(
    botId,
    {
      onTranscriptNew: handleTranscriptNew,
      onTranscriptUpdate: handleTranscriptUpdate,
      onBotStatus: handleBotStatus,
      onError: handleError,
    },
    bot,
  ) // Pass bot to control when room joining happens

  const startPolling = useCallback(() => {
    const interval = setInterval(async () => {
      try {
        // Poll backend for updates
        const [botInfo, transcriptData] = await Promise.all([
          MeetingService.getBotInfo(botId),
          MeetingService.getRealTimeTranscript(botId),
        ])

        if (botInfo) {
          setBot(prevBot => {
            if (!prevBot) return null
            return {
              ...prevBot,
              status: botInfo.status || prevBot.status,
            }
          })
        }

        if (transcriptData && transcriptData.transcripts) {
          const normalizedTranscripts = transcriptData.transcripts.map(
            (entry: any) => ({
              ...entry,
              confidence: entry.confidence ?? 1.0, // Add default confidence if missing
            }),
          )
          setTranscript(normalizedTranscripts)
        }
      } catch {
        // Polling error, continue silently
      }
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [botId])

  useEffect(() => {
    fetchBotData()
  }, [fetchBotData])

  useEffect(() => {
    // Only use polling when WebSocket is disconnected
    if (bot && !loading && !error && !isConnected) {
      console.log('[Bot Data] Starting polling (WebSocket disconnected)')
      const cleanup = startPolling()
      return cleanup
    }
  }, [bot, loading, error, isConnected, startPolling])

  return {
    bot,
    transcript,
    loading,
    error,
    sessionId,
    clientId,
    clientName,
    refetch: fetchBotData,
  }
}
