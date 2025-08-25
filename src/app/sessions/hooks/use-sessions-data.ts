import { useState, useEffect } from 'react'
import { useMeetingHistory } from '@/hooks/use-meeting-history'
import { ClientService } from '@/services/client-service'

interface Client {
  id: string
  name: string
  email?: string
  company?: string
}

export function useSessionsData(pageSize: number = 12) {
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  const {
    data: meetingHistory,
    loading: historyLoading,
    error: historyError,
    refetch,
    fetchMore,
  } = useMeetingHistory(pageSize)

  // Fetch clients for filtering
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true)
        const response = await ClientService.listClients()
        setClients(response.clients || [])
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      } finally {
        setLoadingClients(false)
      }
    }

    fetchClients()
  }, [])

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