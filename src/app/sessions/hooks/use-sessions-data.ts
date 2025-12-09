import { useState, useMemo } from 'react'
import { useMeetingHistory } from '@/hooks/use-meeting-history'
import { useClients } from '@/hooks/queries/use-clients'

/**
 * Custom hook for sessions page data management
 * Now using TanStack Query for clients data with automatic caching
 * Supports filtering by both client and coach
 */
export function useSessionsData(pageSize: number = 12) {
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)

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

  // Extract unique coaches from sessions data
  const coaches = useMemo(() => {
    if (!meetingHistory?.meetings) return []

    const coachMap = new Map<string, { id: string; name: string }>()
    meetingHistory.meetings.forEach(session => {
      // Check if session has coach info - use coach_name directly or from metadata
      const coachId = session.metadata?.coach_id
      const coachName = session.coach_name || session.metadata?.coach_name

      if (coachId && coachName && !coachMap.has(coachId)) {
        coachMap.set(coachId, { id: coachId, name: coachName })
      }
    })

    return Array.from(coachMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }, [meetingHistory?.meetings])

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

  const handleCoachFilter = (coachId: string | null) => {
    setSelectedCoachId(coachId)
    setCurrentPage(0)
    refetch()
  }

  const handleClearFilters = () => {
    setSelectedClientId(null)
    setSelectedCoachId(null)
    setCurrentPage(0)
    refetch()
  }

  // Filter sessions by selected client and/or coach
  const filteredSessions = useMemo(() => {
    let sessions = meetingHistory?.meetings || []

    if (selectedClientId) {
      sessions = sessions.filter(
        session => session.metadata?.client_id === selectedClientId,
      )
    }

    if (selectedCoachId) {
      sessions = sessions.filter(
        session => session.metadata?.coach_id === selectedCoachId,
      )
    }

    return sessions
  }, [meetingHistory?.meetings, selectedClientId, selectedCoachId])

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
