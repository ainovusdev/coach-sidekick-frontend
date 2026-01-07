'use client'

import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Toast, useToast } from '@/components/ui/toast'
import { MeetingLoading } from '@/components/meeting/meeting-loading'
import { MeetingError } from '@/components/meeting/meeting-error'
import { BatchSaveStatus } from '@/components/meeting/batch-save-status'
import { MeetingStatePanel } from '@/components/meeting/meeting-state-panel'
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
    sessionId,
    clientId,
    clientName,
    stopBot,
    isStoppingBot,
  } = useMeetingData({ botId })

  const handleStopBot = async () => {
    if (!bot) return

    try {
      const success = await stopBot(bot.id, sessionId || undefined)
      if (success) {
        showToast(
          'Bot stopped successfully! Redirecting to session details...',
          'success',
        )
        setTimeout(() => {
          // Navigate to session details page if sessionId exists, otherwise go to dashboard
          if (sessionId) {
            router.push(`/sessions/${sessionId}`)
          } else {
            router.push('/')
          }
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
    <div className="h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col overflow-hidden">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      <div className="flex-shrink-0 z-10">
        <MeetingHeader
          bot={bot}
          transcriptLength={transcript.length}
          isStoppingBot={isStoppingBot}
          sessionId={sessionId}
          clientId={clientId}
          clientName={clientName}
          onStopBot={handleStopBot}
          onNavigateBack={() => router.push('/')}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-4 py-3 overflow-hidden">
          <div className="flex-shrink-0 mb-3">
            <MeetingStatePanel state={meetingState} compact={true} />
          </div>
          <div className="flex-1 overflow-hidden">
            <MeetingPanels
              transcript={transcript}
              botId={botId}
              sessionId={sessionId || undefined}
              clientId={clientId || undefined}
            />
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 border-t bg-white/80 backdrop-blur-sm z-10">
        <BatchSaveStatus botId={botId} sessionId={sessionId} minimal={true} />
      </div>
    </div>
  )
}
