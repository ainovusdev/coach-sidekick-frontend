import { useState, useEffect } from 'react'
import { useMeetingHistory } from '@/hooks/use-meeting-history'
import { useDebounceCallback } from '@/hooks/use-debounce'
import { MeetingService } from '@/services/meeting-service'
import { ClientService } from '@/services/client-service'
import { Client } from '@/types/meeting'

export function useDashboardData() {
  const {
    data: meetingHistory,
    loading: historyLoading,
    error: historyError,
    refetch,
  } = useMeetingHistory(5)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true)
        const response = await ClientService.listClients({ per_page: 4 })
        setClients(response.clients)
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        setClientsLoading(false)
      }
    }

    fetchClients()
  }, [])

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