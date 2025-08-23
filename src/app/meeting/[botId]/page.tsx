'use client'

import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { TranscriptViewer } from '@/components/meeting/transcript-viewer'
import { CoachingPanel } from '@/components/meeting/coaching-panel'
import { MeetingStatePanel } from '@/components/meeting/meeting-state-panel'
import { BotStatus } from '@/components/meeting/bot-status'
import { BatchSaveStatus } from '@/components/meeting/batch-save-status'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toast, useToast } from '@/components/ui/toast'
import { MeetingLoading } from '@/components/meeting/meeting-loading'
import { MeetingError } from '@/components/meeting/meeting-error'
import { useBotData } from '@/hooks/use-bot-data'
import { useBotActions } from '@/hooks/use-bot-actions'
import { WebSocketStatus } from '@/components/meeting/websocket-status'
import { DebugPanel } from '@/components/meeting/debug-panel'
import {
  ArrowLeft,
  ExternalLink,
  Users,
  MessageSquare,
  Brain,
  Bug,
} from 'lucide-react'

import { useState, useCallback, useEffect } from 'react'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import { useWebSocket } from '@/contexts/websocket-context'
import { cn } from '@/lib/utils'

export default function MeetingPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.botId as string

  const { bot, transcript, loading, error } = useBotData(botId)
  const { stopBot, isLoading: isStoppingBot } = useBotActions()
  const { toast, showToast, closeToast } = useToast()
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

                <Button
                  variant={showDebug ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Debug
                </Button>

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

        <div className="mb-4">
          <MeetingStatePanel state={meetingState} />
        </div>

        {/* Side by Side Layout - Adjust height when debug panel is shown */}
        <div className={cn(
          "grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-300",
          showDebug ? "h-[450px]" : "h-[700px]"
        )}>
          <Card className="shadow-md h-full flex flex-col overflow-hidden">
            <CardContent className="p-6 flex-1 min-h-0 overflow-auto">
              <TranscriptViewer transcript={transcript} />
            </CardContent>
          </Card>
          <div className="flex flex-col h-full overflow-hidden">
            <CoachingPanel botId={botId} className="shadow-lg h-full" />
          </div>
        </div>

        {/* Debug Panel */}
        {showDebug && bot && (
          <div className="mt-6 pb-6">
            <DebugPanel sessionId={bot.id} className="max-h-[500px]" />
          </div>
        )}
      </div>
    </div>
  )
}
