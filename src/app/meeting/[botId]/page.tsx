'use client'

import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { TranscriptViewer } from '@/components/transcript-viewer'
import { CoachingPanel } from '@/components/coaching-panel'
import { MeetingStatePanel } from '@/components/meeting-state-panel'
import { BotStatus } from '@/components/bot-status'
import { BatchSaveStatus } from '@/components/batch-save-status'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toast, useToast } from '@/components/ui/toast'
import { MeetingLoading } from '@/components/meeting-loading'
import { MeetingError } from '@/components/meeting-error'
import { useBotData } from '@/hooks/use-bot-data'
import { useBotActions } from '@/hooks/use-bot-actions'
import { WebSocketStatus } from '@/components/websocket-status'
import {
  ArrowLeft,
  ExternalLink,
  Users,
  MessageSquare,
  Brain,
} from 'lucide-react'

import { useState, useCallback } from 'react'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'

export default function MeetingPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.botId as string

  const { bot, transcript, loading, error } = useBotData(botId)
  const { stopBot, isLoading: isStoppingBot } = useBotActions()
  const { toast, showToast, closeToast } = useToast()
  const [meetingState, setMeetingState] = useState<any>(null)

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'meeting_state') {
      setMeetingState(message.data)
    }
  }, [])

  // Subscribe to WebSocket events
  useCoachingWebSocket(botId, {
    onMessage: handleWebSocketMessage
  })

  const handleStopBot = async () => {
    if (!bot) return

    try {
      const success = await stopBot(bot.id)
      if (success) {
        showToast('Bot stopped successfully! Redirecting...', 'success')
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        showToast('Failed to stop bot. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Error stopping bot:', error)
      showToast('Failed to stop bot. Please try again.', 'error')
    }
  }

  if (loading) {
    return <MeetingLoading />
  }

  if (error) {
    return <MeetingError error={error} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>

              {bot && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-px bg-gray-300" />
                  <Badge variant="outline" className="font-mono text-xs">
                    {bot.id}
                  </Badge>
                  <BotStatus bot={bot} onStop={handleStopBot} compact />
                  <div className="h-8 w-px bg-gray-300" />
                  <WebSocketStatus />
                </div>
              )}
            </div>

            {bot && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="capitalize">
                      {bot.platform || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{transcript.length} entries</span>
                  </div>
                </div>

                <div className="h-6 w-px bg-gray-300" />

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
                  disabled={bot.status === 'call_ended' || isStoppingBot}
                >
                  {isStoppingBot ? 'Stopping...' : 'Stop Bot'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Section Headers */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900">
                AI Coaching Assistant
              </h1>
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700"
              >
                Real-time
              </Badge>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Live Transcript
              </h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {transcript.length} entries
              </Badge>
            </div>
          </div>
        </div>

        {/* Batch Save Status */}
        <div className="mb-4">
          <BatchSaveStatus botId={botId} />
        </div>

        {/* Meeting State Panel */}
        <div className="mb-4">
          <MeetingStatePanel state={meetingState} />
        </div>

        {/* Side by Side Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
          <Card className="shadow-md h-full overflow-scroll flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col min-h-0">
              <TranscriptViewer transcript={transcript} />
            </CardContent>
          </Card>
          <div className="flex flex-col h-full">
            <CoachingPanel botId={botId} className="shadow-lg h-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
