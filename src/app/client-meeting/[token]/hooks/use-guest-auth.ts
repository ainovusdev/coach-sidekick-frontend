/**
 * Guest Auth Hook
 * Manages guest token in localStorage for the live meeting page
 */

import { useState, useEffect, useCallback } from 'react'
import {
  LiveMeetingService,
  GuestIdentifier,
  getStoredGuestToken,
  setStoredGuestToken,
} from '@/services/live-meeting-service'

interface UseGuestAuthReturn {
  guest: GuestIdentifier | null
  guestToken: string | null
  isLoading: boolean
  error: string | null
  initializeGuest: (displayName?: string) => Promise<void>
}

export function useGuestAuth(meetingToken: string): UseGuestAuthReturn {
  const [guest, setGuest] = useState<GuestIdentifier | null>(null)
  const [guestToken, setGuestToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initializeGuest = useCallback(
    async (displayName?: string) => {
      try {
        setIsLoading(true)
        setError(null)

        // Check for existing guest token in localStorage
        const storedToken = getStoredGuestToken(meetingToken)

        // Create or retrieve guest identifier
        const guestData = await LiveMeetingService.getOrCreateGuest(
          meetingToken,
          storedToken || undefined,
          displayName,
        )

        // Store the guest token
        setStoredGuestToken(meetingToken, guestData.guest_token)

        setGuest(guestData)
        setGuestToken(guestData.guest_token)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to initialize guest'
        setError(message)
        console.error('Guest auth error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [meetingToken],
  )

  // Initialize guest on mount
  useEffect(() => {
    if (meetingToken) {
      initializeGuest()
    }
  }, [meetingToken, initializeGuest])

  return {
    guest,
    guestToken,
    isLoading,
    error,
    initializeGuest,
  }
}
