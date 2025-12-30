import { useState, useMemo } from 'react'
import { useClients } from '@/hooks/queries/use-clients'
import { useCoaches } from '@/hooks/queries/use-coaches'
import { Client } from '@/types/meeting'

export type StatusFilter = 'all' | 'active' | 'invited' | 'not_invited'
export type SortBy = 'name' | 'recent' | 'sessions'

/**
 * Custom hook for clients page data management
 * Manages filter state, search, sort, and client-side filtering
 */
export function useClientsData() {
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('recent')

  // Data fetching via TanStack Query
  const {
    data: clientsData,
    isLoading,
    error: queryError,
    refetch,
  } = useClients()
  const { data: coachesData, isLoading: loadingCoaches } = useCoaches()

  const clients = clientsData?.clients ?? []
  const error = queryError ? 'Failed to load clients' : null

  // Transform coaches data
  const coaches = useMemo(() => {
    if (!coachesData?.coaches) return []
    return coachesData.coaches.map(coach => ({
      id: coach.id,
      name: coach.name,
    }))
  }, [coachesData?.coaches])

  // Helper to check if client is active (session in last 7 days)
  const isClientActive = (client: Client): boolean => {
    const stats = client.client_session_stats?.[0]
    if (!stats?.last_session_date) return false
    const daysDiff = Math.ceil(
      (Date.now() - new Date(stats.last_session_date).getTime()) /
        (1000 * 60 * 60 * 24),
    )
    return daysDiff <= 7
  }

  // Sort clients
  const sortClients = (a: Client, b: Client): number => {
    const statsA = a.client_session_stats?.[0]
    const statsB = b.client_session_stats?.[0]

    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'sessions':
        return (statsB?.total_sessions || 0) - (statsA?.total_sessions || 0)
      case 'recent':
      default:
        const dateA = statsA?.last_session_date
          ? new Date(statsA.last_session_date).getTime()
          : 0
        const dateB = statsB?.last_session_date
          ? new Date(statsB.last_session_date).getTime()
          : 0
        return dateB - dateA
    }
  }

  // Client-side filtering and sorting
  const filteredClients = useMemo(() => {
    return clients
      .filter(client => {
        // Search filter
        const matchesSearch =
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.notes?.toLowerCase().includes(searchTerm.toLowerCase())

        // Status filter
        let matchesStatus = true
        if (statusFilter === 'active') {
          matchesStatus = isClientActive(client)
        } else if (statusFilter === 'invited') {
          matchesStatus = client.invitation_status === 'invited'
        } else if (statusFilter === 'not_invited') {
          matchesStatus =
            client.invitation_status === 'not_invited' ||
            !client.invitation_status
        }

        // Coach filter (filter by coach who owns/assigned the client)
        const matchesCoach =
          !selectedCoachId || client.coach_id === selectedCoachId

        return matchesSearch && matchesStatus && matchesCoach
      })
      .sort(sortClients)
  }, [clients, searchTerm, statusFilter, selectedCoachId, sortBy])

  // Separate into ownership categories
  const myClients = useMemo(
    () => filteredClients.filter(c => c.is_my_client !== false),
    [filteredClients],
  )
  const assignedClients = useMemo(
    () => filteredClients.filter(c => c.is_my_client === false),
    [filteredClients],
  )

  // Stats calculations
  const stats = useMemo(() => {
    const totalSessions = clients.reduce(
      (acc, c) => acc + (c.client_session_stats?.[0]?.total_sessions || 0),
      0,
    )
    const activeThisWeek = clients.filter(isClientActive).length

    return {
      myClientsCount: clients.filter(c => c.is_my_client !== false).length,
      assignedClientsCount: clients.filter(c => c.is_my_client === false)
        .length,
      totalSessions,
      activeThisWeek,
    }
  }, [clients])

  // Derived state
  const hasActiveFilters = statusFilter !== 'all' || selectedCoachId !== null
  const selectedCoach = coaches.find(c => c.id === selectedCoachId)

  // Action handlers
  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status)
  }

  const handleCoachFilter = (coachId: string | null) => {
    setSelectedCoachId(coachId)
  }

  const handleClearFilters = () => {
    setStatusFilter('all')
    setSelectedCoachId(null)
  }

  return {
    // Raw data
    clients: filteredClients,
    myClients,
    assignedClients,
    coaches,

    // Stats
    stats,

    // Loading states
    isLoading,
    loadingCoaches,
    error,

    // Search
    searchTerm,
    setSearchTerm,

    // Status filter
    statusFilter,
    handleStatusFilter,

    // Coach filter
    selectedCoachId,
    selectedCoach,
    handleCoachFilter,

    // General filters
    hasActiveFilters,
    handleClearFilters,

    // Sort
    sortBy,
    setSortBy,

    // Actions
    refetch,
  }
}
