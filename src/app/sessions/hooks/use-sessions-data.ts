import { useState, useMemo } from 'react'
import { useMeetingHistory } from '@/hooks/use-meeting-history'
import { useClients } from '@/hooks/queries/use-clients'
import { useCoaches } from '@/hooks/queries/use-coaches'
import type { SessionTypeFilter } from '../components/sessions-filters'

/**
 * Custom hook for sessions page data management
 * Now using TanStack Query for clients and coaches data with automatic caching
 * Supports server-side filtering by both client and coach
 */
export function useSessionsData(pageSize: number = 12) {
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)
  const [sessionType, setSessionType] = useState<SessionTypeFilter>('all')

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

  const handleSessionTypeFilter = (type: SessionTypeFilter) => {
    setSessionType(type)
    setCurrentPage(0)
  }

  const handleClearFilters = () => {
    setSelectedClientId(null)
    setSelectedCoachId(null)
    setSessionType('all')
    setCurrentPage(0)
    // TanStack Query auto-refetches when queryKey changes (filters are part of queryKey)
  }

  // Sessions filtered server-side by client/coach; session type filtered client-side
  const filteredSessions = useMemo(() => {
    const sessions = meetingHistory?.meetings || []
    if (sessionType === 'all') return sessions
    if (sessionType === 'group') return sessions.filter(s => s.is_group_session)
    return sessions.filter(s => !s.is_group_session) // '1:1'
  }, [meetingHistory?.meetings, sessionType])

  const selectedClient = clients.find(c => c.id === selectedClientId)
  const selectedCoach = coaches.find(c => c.id === selectedCoachId)
  const hasNextPage = meetingHistory?.pagination.hasMore || false
  const hasPrevPage = currentPage > 0
  const hasActiveFilters =
    selectedClientId !== null ||
    selectedCoachId !== null ||
    sessionType !== 'all'

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
    sessionType,
    hasActiveFilters,
    hasNextPage,
    hasPrevPage,
    pageSize,
    handleNextPage,
    handlePrevPage,
    handleClientFilter,
    handleCoachFilter,
    handleSessionTypeFilter,
    handleClearFilters,
    refetch,
  }
}
