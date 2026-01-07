/**
 * Client Meeting Page
 * Live meeting page for clients with notes and commitments
 */

'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useLiveMeetingData } from './hooks/use-live-meeting-data'
import { useGuestAuth } from './hooks/use-guest-auth'
import { useMeetingStatus } from './hooks/use-meeting-status'
import { ClientMeetingHeader } from './components/client-meeting-header'
import { ClientNotesPanel } from './components/client-notes-panel'
import { ClientCommitmentPanel } from './components/client-commitment-panel'
import { PastCommitmentsPanel } from './components/past-commitments-panel'
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

  const { isEnded, durationSeconds } = useMeetingStatus(
    meetingToken,
    sessionInfo?.started_at ?? null,
  )

  // Track notes and commitments count for the ended overlay
  const [notesCount, setNotesCount] = useState(0)
  const [commitmentsCount, setCommitmentsCount] = useState(0)

  // Fetch counts when meeting ends
  useEffect(() => {
    if (isEnded && guestToken) {
      const fetchCounts = async () => {
        try {
          const [notes, commitments] = await Promise.all([
            LiveMeetingService.getNotes(meetingToken, guestToken),
            LiveMeetingService.getCommitments(meetingToken, guestToken),
          ])
          setNotesCount(notes.length)
          setCommitmentsCount(commitments.length)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-gray-600">Joining session...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-red-600"
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Unable to Join
          </h2>
          <p className="text-gray-600 mb-6">{sessionError}</p>
          <p className="text-sm text-gray-500">
            The meeting link may have expired or been revoked.
          </p>
        </div>
      </div>
    )
  }

  if (!sessionInfo) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <ClientMeetingHeader
        coachName={sessionInfo.coach_name}
        clientName={sessionInfo.client_name}
        durationSeconds={durationSeconds}
        isEnded={isEnded}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* Left Column - Notes */}
            <div className="lg:col-span-8 h-full min-h-[400px] lg:min-h-0">
              <ClientNotesPanel
                meetingToken={meetingToken}
                guestToken={guestToken}
              />
            </div>

            {/* Right Column - Commitments */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="flex-1 min-h-[300px]">
                <ClientCommitmentPanel
                  meetingToken={meetingToken}
                  guestToken={guestToken}
                />
              </div>
              <PastCommitmentsPanel
                meetingToken={meetingToken}
                guestToken={guestToken}
              />
            </div>
          </div>
        </div>
      </div>

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
