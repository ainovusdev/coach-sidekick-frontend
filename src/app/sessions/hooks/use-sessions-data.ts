import { useState, useMemo } from 'react'
import { useMeetingHistory } from '@/hooks/use-meeting-history'
import { useClients } from '@/hooks/queries/use-clients'
import { useCoaches } from '@/hooks/queries/use-coaches'

/**
 * Custom hook for sessions page data management
 * Now using TanStack Query for clients and coaches data with automatic caching
 * Supports server-side filtering by both client and coach
 */
export function useSessionsData(pageSize: number = 12) {
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)

  // Pass filters to useMeetingHistory for server-side filtering
  const {
    data: meetingHistory,
    loading: historyLoading,
    error: historyError,
    refetch,
    fetchMore,
  } = useMeetingHistory(pageSize, {
    client_id: selectedClientId,
    coach_id: selectedCoachId,
    page: currentPage + 1, // API uses 1-based pagination
  })

  // Use TanStack Query for clients (automatic caching and deduplication)
  const { data: clientsData, isLoading: loadingClients } = useClients()
  const clients = clientsData?.clients || []

  // Use TanStack Query for coaches (dedicated endpoint)
  const { data: coachesData, isLoading: loadingCoaches } = useCoaches()
  const coaches = useMemo(() => {
    if (!coachesData?.coaches) return []
    return coachesData.coaches.map(coach => ({
      id: coach.id,
      name: coach.name,
    }))
  }, [coachesData?.coaches])

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
    // TanStack Query auto-refetches when queryKey changes (filters are part of queryKey)
  }

  const handleCoachFilter = (coachId: string | null) => {
    setSelectedCoachId(coachId)
    setCurrentPage(0)
    // TanStack Query auto-refetches when queryKey changes (filters are part of queryKey)
  }

  const handleClearFilters = () => {
    setSelectedClientId(null)
    setSelectedCoachId(null)
    setCurrentPage(0)
    // TanStack Query auto-refetches when queryKey changes (filters are part of queryKey)
  }

  // Sessions are now filtered server-side, no client-side filtering needed
  const filteredSessions = meetingHistory?.meetings || []

  const selectedClient = clients.find(c => c.id === selectedClientId)
  const selectedCoach = coaches.find(c => c.id === selectedCoachId)
  const hasNextPage = meetingHistory?.pagination.hasMore || false
  const hasPrevPage = currentPage > 0
  const hasActiveFilters = selectedClientId !== null || selectedCoachId !== null

  return {
    currentPage,
    clients,
    coaches,
    loadingClients,
    loadingCoaches,
    meetingHistory,
    historyLoading,
    historyError,
    filteredSessions,
    selectedClientId,
    selectedClient,
    selectedCoachId,
    selectedCoach,
    hasActiveFilters,
    hasNextPage,
    hasPrevPage,
    pageSize,
    handleNextPage,
    handlePrevPage,
    handleClientFilter,
    handleCoachFilter,
    handleClearFilters,
    refetch,
  }
}
