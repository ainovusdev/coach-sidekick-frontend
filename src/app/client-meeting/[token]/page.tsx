/**
 * Client Meeting Page
 * Live meeting page for clients with notes and commitments
 */

'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Image from 'next/image'
import { useLiveMeetingData } from './hooks/use-live-meeting-data'
import { useGuestAuth } from './hooks/use-guest-auth'
import { useMeetingStatus } from './hooks/use-meeting-status'
import { ClientMeetingHeader } from './components/client-meeting-header'
import { ClientNotesPanel } from './components/client-notes-panel'
import { ClientCommitmentPanel } from './components/client-commitment-panel'
import { MeetingEndedOverlay } from './components/meeting-ended-overlay'
import { LiveMeetingService } from '@/services/live-meeting-service'

export default function ClientMeetingPage() {
  const params = useParams()
  const meetingToken = params.token as string

  // Hooks
  const {
    sessionInfo,
    isLoading: isSessionLoading,
    error: sessionError,
  } = useLiveMeetingData(meetingToken)

  const {
    guestToken,
    isLoading: isGuestLoading,
    error: _guestError,
  } = useGuestAuth(meetingToken)

  const { isEnded, durationSeconds } = useMeetingStatus(meetingToken)

  // Track notes and commitments count for the ended overlay
  const [notesCount, setNotesCount] = useState(0)
  const [commitmentsCount, setCommitmentsCount] = useState(0)

  // Refresh key to trigger manual refresh of data
  const [refreshKey, setRefreshKey] = useState(0)
  const handleRefresh = () => setRefreshKey(k => k + 1)

  // Fetch counts when meeting ends
  useEffect(() => {
    if (isEnded && guestToken) {
      const fetchCounts = async () => {
        try {
          const [notes, commitments] = await Promise.all([
            LiveMeetingService.getNotes(meetingToken, guestToken),
            LiveMeetingService.getCommitments(meetingToken, guestToken),
          ])
          setNotesCount(Array.isArray(notes) ? notes.length : 0)
          setCommitmentsCount(
            Array.isArray(commitments) ? commitments.length : 0,
          )
        } catch {
          // Ignore errors, counts are not critical
        }
      }
      fetchCounts()
    }
  }, [isEnded, meetingToken, guestToken])

  // Loading state
  if (isSessionLoading || isGuestLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4 p-2">
            <Image
              src="/novus-global-logo.webp"
              alt="Logo"
              width={48}
              height={48}
              className="object-contain filter brightness-0 invert"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Coach Sidekick
          </h2>
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Joining session...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (sessionError) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4 p-1.5">
              <Image
                src="/novus-global-logo.webp"
                alt="Logo"
                width={36}
                height={36}
                className="object-contain filter brightness-0 invert"
              />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Coach Sidekick
            </h1>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Unable to Join
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {sessionError}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              The meeting link may have expired or been revoked.
            </p>
          </div>
        </div>
        <footer className="flex-shrink-0 py-3 border-t border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-5 h-5 bg-gray-900 rounded-md flex items-center justify-center p-0.5">
              <Image
                src="/novus-global-logo.webp"
                alt="Logo"
                width={16}
                height={16}
                className="object-contain filter brightness-0 invert"
              />
            </div>
            <span>
              Powered by{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Coach Sidekick
              </span>
            </span>
          </div>
        </footer>
      </div>
    )
  }

  if (!sessionInfo) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <ClientMeetingHeader
        coachName={sessionInfo.coach_name}
        clientName={sessionInfo.client_name}
        durationSeconds={durationSeconds}
        isEnded={isEnded}
        onRefresh={handleRefresh}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* Left Column - Notes */}
            <div className="lg:col-span-8 h-full min-h-[400px] lg:min-h-0">
              <ClientNotesPanel
                meetingToken={meetingToken}
                guestToken={guestToken}
                refreshKey={refreshKey}
              />
            </div>

            {/* Right Column - Commitments */}
            <div className="lg:col-span-4 h-full min-h-[400px] lg:min-h-0">
              <ClientCommitmentPanel
                meetingToken={meetingToken}
                guestToken={guestToken}
                refreshKey={refreshKey}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer with branding */}
      <footer className="flex-shrink-0 py-3 border-t border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-5 h-5 bg-gray-900 rounded-md flex items-center justify-center p-0.5">
              <Image
                src="/novus-global-logo.webp"
                alt="Logo"
                width={16}
                height={16}
                className="object-contain filter brightness-0 invert"
              />
            </div>
            <span>
              Powered by{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Coach Sidekick
              </span>
            </span>
          </div>
        </div>
      </footer>

      {/* Meeting Ended Overlay */}
      {isEnded && (
        <MeetingEndedOverlay
          coachName={sessionInfo.coach_name}
          notesCount={notesCount}
          commitmentsCount={commitmentsCount}
        />
      )}
    </div>
  )
}
