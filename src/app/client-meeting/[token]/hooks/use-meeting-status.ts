/**
 * Meeting Status Hook
 * Polls for session status to detect when meeting ends
 * Uses backend-calculated duration_seconds for accuracy
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LiveMeetingService,
  SessionStatus,
} from '@/services/live-meeting-service'

interface UseMeetingStatusReturn {
  status: SessionStatus | null
  isEnded: boolean
  durationSeconds: number
  isPolling: boolean
}

const POLL_INTERVAL = 10000 // 10 seconds

export function useMeetingStatus(
  meetingToken: string,
  initialDurationSeconds: number | null,
): UseMeetingStatusReturn {
  const [status, setStatus] = useState<SessionStatus | null>(null)
  const [isEnded, setIsEnded] = useState(false)
  const [durationSeconds, setDurationSeconds] = useState(
    initialDurationSeconds ?? 0,
  )
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  // Track the last known server duration to sync with
  const lastServerDurationRef = useRef<number>(initialDurationSeconds ?? 0)

  // Update duration every second (incrementing locally between polls)
  useEffect(() => {
    if (isEnded) return

    // Increment timer every second
    timerRef.current = setInterval(() => {
      setDurationSeconds(prev => prev + 1)
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isEnded])

  // Poll for status
  const fetchStatus = useCallback(async () => {
    if (!meetingToken || isEnded) return

    try {
      const data = await LiveMeetingService.getSessionStatus(meetingToken)
      setStatus(data)

      // Sync duration from server to correct any drift
      if (
        data.duration_seconds !== null &&
        data.duration_seconds !== undefined
      ) {
        setDurationSeconds(data.duration_seconds)
        lastServerDurationRef.current = data.duration_seconds
      }

      if (data.is_ended) {
        setIsEnded(true)
        // Stop polling once meeting has ended
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setIsPolling(false)
      }
    } catch (err) {
      console.error('Failed to fetch session status:', err)
    }
  }, [meetingToken, isEnded])

  // Start polling
  useEffect(() => {
    if (!meetingToken || isEnded) return

    setIsPolling(true)

    // Initial fetch
    fetchStatus()

    // Poll every 10 seconds
    intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPolling(false)
    }
  }, [meetingToken, fetchStatus, isEnded])

  return {
    status,
    isEnded,
    durationSeconds,
    isPolling,
  }
}

/**
 * Format seconds as HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
