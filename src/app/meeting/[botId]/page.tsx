'use client'

import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Toast, useToast } from '@/components/ui/toast'
import { MeetingLoading } from '@/components/meeting/meeting-loading'
import { MeetingError } from '@/components/meeting/meeting-error'
import { BatchSaveStatus } from '@/components/meeting/batch-save-status'
import { MeetingStatePanel } from '@/components/meeting/meeting-state-panel'
import { WebSocketControl } from '@/components/meeting/websocket-control'
import { useMeetingData } from './hooks/use-meeting-data'
import MeetingHeader from './components/meeting-header'
import MeetingPanels from './components/meeting-panels'

export default function MeetingPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.botId as string
  const { toast, showToast, closeToast } = useToast()

  const {
    bot,
    transcript,
    loading,
    error,
    meetingState,
    stopBot,
    pauseBot,
    resumeBot,
    isStoppingBot,
    isPaused,
  } = useMeetingData({ botId })

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

  const handlePauseResume = async () => {
    if (!bot) return

    try {
      if (isPaused) {
        const success = await resumeBot(bot.id)
        if (success) {
          showToast('Recording resumed', 'success')
        } else {
          showToast('Failed to resume recording', 'error')
        }
      } else {
        const success = await pauseBot(bot.id)
        if (success) {
          showToast('Recording paused', 'success')
        } else {
          showToast('Failed to pause recording', 'error')
        }
      }
    } catch (error) {
      console.error('Error toggling pause state:', error)
      showToast('Failed to toggle pause state', 'error')
    }
  }

  if (loading) {
    return <MeetingLoading />
  }

  if (error) {
    return <MeetingError error={error} />
  }

  return (
    <div className="h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col overflow-hidden">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      {/* Fixed Header */}
      <div className="flex-shrink-0 z-10">
        <MeetingHeader
          bot={bot}
          transcriptLength={transcript.length}
          isStoppingBot={isStoppingBot}
          isPaused={isPaused}
          onStopBot={handleStopBot}
          onPauseResume={handlePauseResume}
          onNavigateBack={() => router.push('/')}
        />
      </div>

      {/* Main Content Area - Fixed Height */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-4 py-3 overflow-hidden">
          {/* WebSocket Control and Meeting State - Fixed */}
          <div className="flex-shrink-0 mb-3 space-y-3">
            <WebSocketControl botId={botId} />
            <MeetingStatePanel state={meetingState} compact={true} />
          </div>

          {/* Main Panels - Constrained Height */}
          <div className="flex-1 overflow-hidden">
            <MeetingPanels transcript={transcript} botId={botId} />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Save Status Bar */}
      <div className="flex-shrink-0 border-t bg-white/80 backdrop-blur-sm z-10">
        <div className="max-w-[1600px] mx-auto px-4 py-2">
          <BatchSaveStatus botId={botId} minimal={true} />
        </div>
      </div>
    </div>
  )
}
