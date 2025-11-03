import { Client, ClientSessionStats } from '@/types/meeting'
import { useClient, useClientSessions } from '@/hooks/queries/use-clients'

interface ClientWithStats extends Client {
  client_session_stats?: ClientSessionStats[]
  is_my_client?: boolean
  coach_name?: string
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
  refetch: () => void
}

/**
 * Custom hook to fetch client data and their sessions
 * Now powered by TanStack Query for automatic caching and deduplication
 *
 * Benefits:
 * - Cached data shown immediately on revisit
 * - Automatic background revalidation
 * - No duplicate requests if multiple components use this
 * - Built-in error handling and retry logic
 */
export function useClientData(
  clientId: string | null | undefined,
  _userId: string | undefined,
): UseClientDataReturn {
  // Fetch client details with TanStack Query
  const {
    data: client,
    isLoading: clientLoading,
    error: clientError,
    refetch: refetchClient,
  } = useClient(clientId ?? undefined)

  // Fetch client sessions with TanStack Query
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useClientSessions(clientId ?? undefined, { per_page: 10 })

  // Combined loading state
  const loading = clientLoading || sessionsLoading

  // Combined error state
  const error = clientError
    ? 'Failed to load client details'
    : sessionsError
      ? 'Failed to load client sessions'
      : null

  // Combined refetch function
  const refetch = () => {
    refetchClient()
    refetchSessions()
  }

  return {
    client: client ?? null,
    sessions: sessionsData?.sessions ?? [],
    loading,
    error,
    refetch,
  }
}
