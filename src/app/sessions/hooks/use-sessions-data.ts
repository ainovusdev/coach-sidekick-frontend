import { useState } from 'react'
import { useMeetingHistory } from '@/hooks/use-meeting-history'
import { useClients } from '@/hooks/queries/use-clients'

/**
 * Custom hook for sessions page data management
 * Now using TanStack Query for clients data with automatic caching
 */
export function useSessionsData(pageSize: number = 12) {
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const {
    data: meetingHistory,
    loading: historyLoading,
    error: historyError,
    refetch,
    fetchMore,
  } = useMeetingHistory(pageSize)

  // Use TanStack Query for clients (automatic caching and deduplication)
  const { data: clientsData, isLoading: loadingClients } = useClients()
  const clients = clientsData?.clients || []

  const handleNextPage = () => {
    const newOffset = (currentPage + 1) * pageSize
    fetchMore(newOffset)
    setCurrentPage(currentPage + 1)
  }

  const handlePrevPage = () => {
    const newOffset = Math.max(0, (currentPage - 1) * pageSize)
    fetchMore(newOffset)
    setCurrentPage(Math.max(0, currentPage - 1))
  }

  const handleClientFilter = (clientId: string | null) => {
    setSelectedClientId(clientId)
    setCurrentPage(0)
    refetch()
  }

  // Filter sessions by selected client
  const filteredSessions = selectedClientId
    ? meetingHistory?.meetings.filter(
        session => session.metadata?.client_id === selectedClientId,
      ) || []
    : meetingHistory?.meetings || []

  const selectedClient = clients.find(c => c.id === selectedClientId)
  const hasNextPage = meetingHistory?.pagination.hasMore || false
  const hasPrevPage = currentPage > 0

  return {
    currentPage,
    clients,
    loadingClients,
    meetingHistory,
    historyLoading,
    historyError,
    filteredSessions,
    selectedClientId,
    selectedClient,
    hasNextPage,
    hasPrevPage,
    pageSize,
    handleNextPage,
    handlePrevPage,
    handleClientFilter,
    refetch,
  }
}
