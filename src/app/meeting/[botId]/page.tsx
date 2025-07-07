'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BotStatus } from '@/components/bot-status'
import { TranscriptViewer } from '@/components/transcript-viewer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Bot,
  ExternalLink,
  Square,
  Activity,
  Clock,
  Users,
  MessageSquare,
} from 'lucide-react'

interface Bot {
  id: string
  status: string | undefined
  meeting_url: string
  platform?: string
  meeting_id?: string
}

interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
  confidence?: number
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

  // Fetch initial bot data
  const fetchBotData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log(`[Meeting Page] Fetching initial data for bot ID: ${botId}`)

      // Try real-time transcript endpoint
      const realtimeResponse = await fetch(
        `/api/recall/realtime-transcript/${botId}`,
      )

      if (realtimeResponse.ok) {
        const data = await realtimeResponse.json()
        console.log('[Meeting Page] Real-time data:', data)
        console.log('[Meeting Page] Initial transcript data:', data.transcript)

        if (data.bot) {
          // Normalize meeting_url if it's an object
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

        // Always set transcript, even if empty
        setTranscript(data.transcript || [])
        console.log(
          '[Meeting Page] Set initial transcript with',
          (data.transcript || []).length,
          'entries',
        )
        console.log(
          '[Meeting Page] Initial transcript entries:',
          data.transcript || [],
        )

        setLoading(false)
        return
      } else {
        // Check if it's a configuration error
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

        // If API returns error, throw to be caught below
        throw new Error(`API Error: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('[Meeting Page] Error fetching bot data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [botId])

  // Start polling for updates
  const startPolling = useCallback(() => {
    const interval = setInterval(async () => {
      try {
        console.log(`[Meeting Page] Polling for bot ID: ${botId}`)

        // Try real-time endpoint for live updates
        const realtimeResponse = await fetch(
          `/api/recall/realtime-transcript/${botId}`,
        )

        if (realtimeResponse.ok) {
          const data = await realtimeResponse.json()
          console.log('[Meeting Page] Real-time polling update:', data)
          console.log(
            '[Meeting Page] Received transcript data:',
            data.transcript,
          )

          // Update bot status
          if (data.bot) {
            setBot(prevBot => {
              if (!prevBot) return null
              return {
                ...prevBot,
                status: data.bot.status || prevBot.status,
              }
            })
          }

          // Always update transcript with real-time data
          if (data.transcript !== undefined) {
            setTranscript(data.transcript)
          }
        } else {
          // Try debug endpoint if polling fails
          try {
            const debugResponse = await fetch(
              `/api/recall/debug?botId=${botId}`,
            )
            if (debugResponse.ok) {
              const debugData = await debugResponse.json()
              console.log(
                '[Meeting Page] Debug data after polling failure:',
                debugData,
              )
            }
          } catch (debugError) {
            console.error('[Meeting Page] Debug fetch failed:', debugError)
          }
        }
      } catch (error) {
        console.error('[Meeting Page] Polling error:', error)
      }
    }, 8000) // Poll every 1 second for more responsive live updates

    return () => clearInterval(interval)
  }, [botId, transcript.length])

  // Stop bot
  const stopBot = async () => {
    if (!bot) return

    try {
      await fetch(`/api/recall/stop-bot/${bot.id}`, {
        method: 'POST',
      })

      // Update status locally
      setBot(prev => (prev ? { ...prev, status: 'stopping' } : null))

      // Navigate back to home after stopping
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error) {
      console.error('Error stopping bot:', error)
    }
  }

  // Initialize page
  useEffect(() => {
    fetchBotData()
  }, [fetchBotData])

  // Start polling after initial load
  useEffect(() => {
    if (!loading && bot) {
      const cleanup = startPolling()
      return cleanup
    }
  }, [loading, bot, startPolling])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error || 'Bot not found'}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/')} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const getStatusVariant = (status: string | undefined) => {
    if (!status) return 'outline'

    switch (status) {
      case 'in_call_recording':
      case 'recording':
        return 'default'
      case 'done':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-muted-foreground" />
                <h1 className="text-lg font-semibold">Meeting Session</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-xs font-mono">
                {bot.id}
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={stopBot}
                disabled={bot.status === 'stopping' || bot.status === 'done'}
              >
                <Square className="w-4 h-4 mr-2" />
                {bot.status === 'stopping' ? 'Stopping...' : 'Stop Bot'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Bot Status & Meeting Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Bot Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BotStatus bot={bot} onStop={stopBot} />
              </CardContent>
            </Card>

            {/* Meeting Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Meeting Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Platform
                  </label>
                  <p className="text-sm font-medium capitalize">
                    {bot.platform || 'Google Meet'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Meeting ID
                  </label>
                  <p className="text-sm font-mono">{bot.meeting_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Meeting URL
                  </label>
                  <Button variant="link" asChild className="h-auto p-0 text-sm">
                    <a
                      href={bot.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1"
                    >
                      <span className="truncate">Open Meeting</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Session Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={getStatusVariant(bot.status)}
                    className="text-xs"
                  >
                    {(bot.status || 'Connecting')
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Transcript Entries
                  </span>
                  <span className="text-sm font-medium">
                    {transcript.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Session Time
                  </span>
                  <div className="flex items-center space-x-1 text-sm">
                    <Clock className="w-3 h-3" />
                    <span>Live</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Live Transcript */}
          <div className="lg:col-span-2">
            <TranscriptViewer transcript={transcript} />
          </div>
        </div>
      </main>
    </div>
  )
}
