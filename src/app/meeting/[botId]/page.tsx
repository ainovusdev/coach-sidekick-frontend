'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BotStatus } from '@/components/bot-status'
import { TranscriptViewer } from '@/components/transcript-viewer'

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
      const response = await fetch(`/api/recall/transcript/${botId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch bot data')
      }

      const data = await response.json()
      console.log('[Meeting Page] Initial bot data:', data)

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

      if (data.transcript && data.transcript.length > 0) {
        setTranscript(data.transcript)
      }

      setError(null)
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
        const response = await fetch(`/api/recall/transcript/${botId}`)
        if (response.ok) {
          const data = await response.json()
          console.log('[Meeting Page] Polling update:', data)

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

          // Update transcript
          if (data.transcript && data.transcript.length > 0) {
            setTranscript(data.transcript)
            console.log(
              '[Meeting Page] Updated transcript with',
              data.transcript.length,
              'entries',
            )
          }
        }
      } catch (error) {
        console.error('[Meeting Page] Polling error:', error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [botId])

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meeting data...</p>
        </div>
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>
              <strong>Error:</strong> {error || 'Bot not found'}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Meeting Session
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Bot ID: {bot.id}</span>
              <button
                onClick={stopBot}
                disabled={bot.status === 'stopping' || bot.status === 'done'}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {bot.status === 'stopping' ? 'Stopping...' : 'Stop Bot'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Bot Status & Meeting Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Bot Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Bot Status
              </h2>
              <BotStatus bot={bot} onStop={stopBot} />
            </div>

            {/* Meeting Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Meeting Info
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Platform
                  </label>
                  <p className="text-gray-900 capitalize">
                    {bot.platform || 'Google Meet'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Meeting ID
                  </label>
                  <p className="text-gray-900 font-mono text-sm">
                    {bot.meeting_id || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Meeting URL
                  </label>
                  <a
                    href={bot.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm break-all"
                  >
                    {bot.meeting_url}
                  </a>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Session Stats
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transcript Entries</span>
                  <span className="font-medium">{transcript.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={`font-medium ${
                      bot.status === 'done'
                        ? 'text-green-600'
                        : bot.status === 'in_call_recording'
                        ? 'text-blue-600'
                        : bot.status === 'error'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {bot.status
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Live Transcript */}
          <div className="lg:col-span-2">
            <TranscriptViewer transcript={transcript} />
          </div>
        </div>
      </div>
    </div>
  )
}
