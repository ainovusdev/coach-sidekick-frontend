'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BotStatus } from '@/components/bot-status'
import { TranscriptViewer } from '@/components/transcript-viewer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ExternalLink } from 'lucide-react'

interface Bot {
  id: string
  status: string
  meeting_url: string
  platform?: string
  meeting_id?: string
}

interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
  confidence: number
  is_final: boolean
  start_time?: number
  end_time?: number
}

export default function MeetingPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.botId as string

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
  }, [botId, transcript.length])

  useEffect(() => {
    fetchBotData()
  }, [fetchBotData])

  useEffect(() => {
    if (bot && !loading && !error) {
      const cleanup = startPolling()
      return cleanup
    }
  }, [bot, loading, error, startPolling])

  const handleStopBot = async () => {
    try {
      const response = await fetch(`/api/recall/stop-bot/${botId}`, {
        method: 'POST',
      })

      if (response.ok) {
        setBot(prev => (prev ? { ...prev, status: 'call_ended' } : null))
      }
    } catch {
      alert('Failed to stop bot')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meeting data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Configuration Error
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            {bot && (
              <div className="flex items-center gap-2">
                {bot.meeting_url !== '#' && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={bot.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Join Meeting
                    </a>
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStopBot}
                  disabled={bot.status === 'call_ended'}
                >
                  Stop Bot
                </Button>
              </div>
            )}
          </div>

          {bot && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    Meeting Session
                    <Badge variant="outline">{bot.id}</Badge>
                  </CardTitle>
                  <BotStatus bot={bot} onStop={handleStopBot} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Platform:</span>
                    <p className="capitalize">{bot.platform || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Meeting ID:
                    </span>
                    <p>{bot.meeting_id || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Transcript Entries:
                    </span>
                    <p>{transcript.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>Live Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <TranscriptViewer transcript={transcript} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
