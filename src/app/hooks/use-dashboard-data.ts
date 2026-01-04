import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMeetingHistory } from '@/hooks/use-meeting-history'
import { useDebounceCallback } from '@/hooks/use-debounce'
import { MeetingService } from '@/services/meeting-service'
import { useClientsSimple } from '@/hooks/queries/use-clients'
import { ClientService } from '@/services/client-service'
import { queryKeys } from '@/lib/query-client'

/**
 * Dashboard data hook - now using TanStack Query for clients
 * Benefits:
 * - Clients data cached and deduplicated
 * - Instant loading if data already in cache
 * - Automatic background refresh
 * - Uses lightweight client list (no session stats) for faster loading
 * - Prefetches full client list for /clients page
 */
export function useDashboardData() {
  const queryClient = useQueryClient()

  const {
    data: meetingHistory,
    loading: historyLoading,
    error: historyError,
    refetch,
  } = useMeetingHistory(5)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use lightweight clients query for fast dashboard loading
  const { data: clientsData, isLoading: clientsLoading } = useClientsSimple()
  const clients = clientsData?.clients || []

  // Prefetch full clients list in background for /clients page
  useEffect(() => {
    // Small delay to prioritize dashboard loading first
    const timer = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.clients.list(),
        queryFn: () => ClientService.listClients(),
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [queryClient])

  const handleCreateBotImpl = async (meetingUrl: string, clientId?: string) => {
    // Prevent multiple submissions
    if (loading) {
      console.log('Already loading, ignoring duplicate submission')
      return
    }

    console.log('Creating bot for URL:', meetingUrl, 'ClientID:', clientId)
    setLoading(true)
    setError(null) // Clear any previous errors

    try {
      // Create bot via backend API
      const response = await MeetingService.createBot({
        meeting_url: meetingUrl,
        client_id: clientId,
        recording_mode: 'raw_transcript',
        bot_name: 'Coach Sidekick Assistant',
      })

      console.log('Bot created successfully:', response)

      if (!response.id) {
        throw new Error('Bot was created but no ID was returned')
      }

      // Small delay to ensure state is consistent before navigation
      await new Promise(resolve => setTimeout(resolve, 100))

      return response.id // Return the bot ID for navigation
    } catch (error) {
      console.error('Error creating bot:', error)
      setLoading(false) // Reset loading state immediately on error

      // Set error state for display in UI
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create bot'
      setError(errorMessage)
      throw error // Re-throw to handle in component
    }
  }

  // Create debounced callback at hook level
  const debouncedCreateBot = useDebounceCallback(handleCreateBotImpl, 1000)

  // Calculate stats from meeting history
  const totalSessions = meetingHistory?.meetings.length || 0

  return {
    meetingHistory,
    historyLoading,
    historyError,
    clients,
    clientsLoading,
    loading,
    error,
    totalSessions,
    debouncedCreateBot,
    refetch,
    setError,
  }
}
