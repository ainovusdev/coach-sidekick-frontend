import { useState, useEffect, useCallback } from 'react'
import { Bot, TranscriptEntry } from '@/types/meeting'

interface UseBotDataReturn {
  bot: Bot | null
  transcript: TranscriptEntry[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBotData(botId: string): UseBotDataReturn {
  const [bot, setBot] = useState<Bot | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBotData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const realtimeResponse = await fetch(
        `/api/recall/realtime-transcript/${botId}`,
      )

      if (realtimeResponse.ok) {
        const data = await realtimeResponse.json()

        if (data.bot) {
          const normalizedBot = {
            ...data.bot,
            meeting_url:
              typeof data.bot.meeting_url === 'string'
                ? data.bot.meeting_url
                : data.bot.meeting_url?.meeting_id
                ? `https://meet.google.com/${data.bot.meeting_url.meeting_id}`
                : '#',
          }
          setBot(normalizedBot)
        }

        setTranscript(data.transcript || [])
        setLoading(false)
        return
      } else {
        const errorData = await realtimeResponse.json().catch(() => ({}))
        if (
          errorData.error === 'Application not configured' ||
          errorData.error === 'Configuration error'
        ) {
          setError(
            errorData.message ||
              'Application is not properly configured. Please check your environment variables.',
          )
          setLoading(false)
          return
        }

        throw new Error(`API Error: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [botId])

  const startPolling = useCallback(() => {
    const interval = setInterval(async () => {
      try {
        const realtimeResponse = await fetch(
          `/api/recall/realtime-transcript/${botId}`,
        )

        if (realtimeResponse.ok) {
          const data = await realtimeResponse.json()

          if (data.bot) {
            setBot(prevBot => {
              if (!prevBot) return null
              return {
                ...prevBot,
                status: data.bot.status || prevBot.status,
              }
            })
          }

          if (data.transcript !== undefined) {
            setTranscript(data.transcript)
          }
        } else {
          try {
            await fetch(`/api/recall/debug?botId=${botId}`)
          } catch {
            // Debug fetch failed, continue silently
          }
        }
      } catch {
        // Polling error, continue silently
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [botId])

  useEffect(() => {
    fetchBotData()
  }, [fetchBotData])

  useEffect(() => {
    if (bot && !loading && !error) {
      const cleanup = startPolling()
      return cleanup
    }
  }, [bot, loading, error, startPolling])

  return {
    bot,
    transcript,
    loading,
    error,
    refetch: fetchBotData,
  }
}
