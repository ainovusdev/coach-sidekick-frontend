import { useState, useEffect, useCallback } from 'react'
import { Client, ClientSessionStats } from '@/types/meeting'
import { ClientService } from '@/services/client-service'
import { SessionService } from '@/services/session-service'

interface ClientWithStats extends Client {
  client_session_stats?: ClientSessionStats[]
}

interface ClientSession {
  id: string
  bot_id: string
  status: string
  created_at: string
  meeting_summaries?: Array<{
    duration_minutes: number
    final_overall_score?: number
    meeting_summary: string
  }>
  summary?: string
  key_topics?: string[]
  action_items?: string[]
  duration_seconds?: number
}

interface UseClientDataReturn {
  client: ClientWithStats | null
  sessions: ClientSession[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useClientData(clientId: string | null | undefined, userId: string | undefined): UseClientDataReturn {
  const [client, setClient] = useState<ClientWithStats | null>(null)
  const [sessions, setSessions] = useState<ClientSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClientData = useCallback(async () => {
    if (!clientId || !userId) return
    
    setLoading(true)
    setError(null)

    try {
      // Fetch client details
      const clientData = await ClientService.getClient(clientId)
      setClient(clientData)

      // Fetch client sessions
      const sessionsData = await SessionService.getClientSessions(clientId, {
        per_page: 10
      })
      setSessions(sessionsData.sessions || [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      )
    } finally {
      setLoading(false)
    }
  }, [clientId, userId])

  useEffect(() => {
    if (!userId || !clientId) {
      setLoading(false)
      return
    }

    fetchClientData()
  }, [clientId, userId, fetchClientData])

  return {
    client,
    sessions,
    loading,
    error,
    refetch: fetchClientData
  }
}