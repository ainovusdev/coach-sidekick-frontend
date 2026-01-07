/**
 * Live Meeting Data Hook
 * Fetches session info and validates the meeting token
 */

import { useState, useEffect } from 'react'
import {
  LiveMeetingService,
  LiveSessionInfo,
} from '@/services/live-meeting-service'

interface UseLiveMeetingDataReturn {
  sessionInfo: LiveSessionInfo | null
  isLoading: boolean
  error: string | null
  isEnded: boolean
  refetch: () => Promise<void>
}

export function useLiveMeetingData(
  meetingToken: string,
): UseLiveMeetingDataReturn {
  const [sessionInfo, setSessionInfo] = useState<LiveSessionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessionInfo = async () => {
    if (!meetingToken) {
      setError('No meeting token provided')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const data = await LiveMeetingService.joinMeeting(meetingToken)
      setSessionInfo(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load meeting'
      setError(message)
      console.error('Live meeting data error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessionInfo()
  }, [meetingToken])

  return {
    sessionInfo,
    isLoading,
    error,
    isEnded: sessionInfo?.is_ended ?? false,
    refetch: fetchSessionInfo,
  }
}
