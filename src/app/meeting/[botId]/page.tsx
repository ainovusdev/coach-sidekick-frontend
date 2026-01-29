'use client'

import { useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Toast, useToast } from '@/components/ui/toast'
import { MeetingLoading } from '@/components/meeting/meeting-loading'
import { MeetingError } from '@/components/meeting/meeting-error'
import { BatchSaveStatus } from '@/components/meeting/batch-save-status'
import { useMeetingData } from './hooks/use-meeting-data'
import MeetingHeader from './components/meeting-header'
import MeetingPanels from './components/meeting-panels'

export default function MeetingPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.botId as string
  const { toast, showToast, closeToast } = useToast()
  const hasShownProcessingToast = useRef(false)
  const hasShownCompletionToast = useRef(false)
  const sessionIdRef = useRef<string | null>(null)
  const completedSessionIdRef = useRef<string | null>(null)

  const {
    bot,
    transcript,
    loading,
    error,
    sessionId,
    clientId,
    clientName,
    stopBot,
    isStoppingBot,
    isMeetingEnded,
    isSessionCompleted,
    completedSessionId,
  } = useMeetingData({ botId })

  // Keep refs updated with latest values
  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  useEffect(() => {
    completedSessionIdRef.current = completedSessionId
  }, [completedSessionId])

  // Show "processing" toast when meeting ends (bot:status received)
  useEffect(() => {
    if (
      isMeetingEnded &&
      !isSessionCompleted &&
      !hasShownProcessingToast.current
    ) {
      hasShownProcessingToast.current = true
      console.log(
        '[MeetingPage] Meeting ended, waiting for session processing...',
      )
      showToast('Meeting ended. Processing session...', 'success')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMeetingEnded, isSessionCompleted])

  // Auto-redirect when session processing is complete (session:completed received)
  // Use replace() instead of push() so the meeting page is not in the history stack
  // This allows the back button on session details to go to client profile, not meeting page
  useEffect(() => {
    if (isSessionCompleted && !hasShownCompletionToast.current) {
      hasShownCompletionToast.current = true

      console.log(
        '[MeetingPage] Session processing complete, sessionId:',
        sessionId,
        'completedSessionId:',
        completedSessionId,
      )
      showToast('Session saved! Redirecting to summary...', 'success')

      // Short delay before redirect since processing is already done
      setTimeout(() => {
        const redirectSessionId =
          completedSessionIdRef.current || sessionIdRef.current
        console.log('[MeetingPage] Executing redirect to:', redirectSessionId)
        if (redirectSessionId) {
          router.replace(`/sessions/${redirectSessionId}`)
        } else {
          console.log(
            '[MeetingPage] No session ID available, redirecting to home',
          )
          router.replace('/')
        }
      }, 1500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSessionCompleted])

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
          // Use replace() so the meeting page is not in the history stack
          if (sessionId) {
            router.replace(`/sessions/${sessionId}`)
          } else {
            router.replace('/')
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
    <div className="h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col overflow-hidden">
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
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
        <BatchSaveStatus botId={botId} sessionId={sessionId} minimal={true} />
      </div>
    </div>
  )
}
