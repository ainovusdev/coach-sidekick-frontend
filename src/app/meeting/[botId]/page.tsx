'use client'

import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Toast, useToast } from '@/components/ui/toast'
import { MeetingLoading } from '@/components/meeting/meeting-loading'
import { MeetingError } from '@/components/meeting/meeting-error'
import { BatchSaveStatus } from '@/components/meeting/batch-save-status'
import { MeetingStatePanel } from '@/components/meeting/meeting-state-panel'
import { DebugPanel } from '@/components/meeting/debug-panel'
import { useMeetingData } from './hooks/use-meeting-data'
import MeetingHeader from './components/meeting-header'
import MeetingContentHeader from './components/meeting-content-header'
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
    showDebug,
    setShowDebug,
    stopBot,
    isStoppingBot,
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

  if (loading) {
    return <MeetingLoading />
  }

  if (error) {
    return <MeetingError error={error} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      <MeetingHeader
        bot={bot}
        transcriptLength={transcript.length}
        showDebug={showDebug}
        isStoppingBot={isStoppingBot}
        onToggleDebug={() => setShowDebug(!showDebug)}
        onStopBot={handleStopBot}
        onNavigateBack={() => router.push('/')}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Section Headers */}
        <MeetingContentHeader transcriptLength={transcript.length} />

        <div className="mb-4">
          <BatchSaveStatus botId={botId} />
        </div>

        <div className="mb-4">
          <MeetingStatePanel state={meetingState} />
        </div>

        <MeetingPanels
          transcript={transcript}
          botId={botId}
          showDebug={showDebug}
        />

        {showDebug && bot && (
          <div className="mt-6 pb-6">
            <DebugPanel sessionId={bot.id} className="max-h-[500px]" />
          </div>
        )}
      </div>
    </div>
  )
}
