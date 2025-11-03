import { useClients } from './use-clients'
import { useSessions } from './use-sessions'
import { useCommitments } from './use-commitments'
import { useClientPersona } from './use-personas'
import { useCurrentSprint } from './use-sprints'
import { useClientSessions } from './use-clients'

/**
 * Hook for client dashboard - fetches all necessary data in parallel
 *
 * Benefits:
 * - All queries run in parallel (6 requests → 1 network round trip)
 * - Shared cache between queries (client data reused across requests)
 * - Automatic deduplication if multiple components use this
 * - Stale-while-revalidate for instant navigation
 *
 * @param clientId - The client ID for the dashboard
 *
 * @example
 * const { data, isLoading } = useClientDashboard(clientId)
 * const { client, sessions, persona, currentSprint, commitments } = data
 */
export function useClientDashboard(clientId: string | undefined) {
  // Fetch client detail
  const clientQuery = useClients()

  // Fetch recent sessions (last 5)
  const sessionsQuery = useClientSessions(clientId, { per_page: 5 })

  // Fetch client persona
  const personaQuery = useClientPersona(clientId)

  // Fetch current active sprint
  const sprintQuery = useCurrentSprint(clientId)

  // Fetch active commitments
  const commitmentsQuery = useCommitments(
    { client_id: clientId, status: 'active' },
    { enabled: !!clientId },
  )

  // Combine loading states
  const isLoading =
    clientQuery.isLoading ||
    sessionsQuery.isLoading ||
    personaQuery.isLoading ||
    sprintQuery.isLoading ||
    commitmentsQuery.isLoading

  // Combine error states
  const error =
    clientQuery.error ||
    sessionsQuery.error ||
    personaQuery.error ||
    sprintQuery.error ||
    commitmentsQuery.error

  return {
    data: {
      clients: clientQuery.data?.clients,
      sessions: sessionsQuery.data?.sessions ?? [],
      persona: personaQuery.data,
      currentSprint: sprintQuery.data,
      commitments: commitmentsQuery.data?.commitments ?? [],
    },
    isLoading,
    error,
    refetch: () => {
      clientQuery.refetch()
      sessionsQuery.refetch()
      personaQuery.refetch()
      sprintQuery.refetch()
      commitmentsQuery.refetch()
    },
  }
}

/**
 * Hook for coach dashboard - overview of all coaching activity
 *
 * @example
 * const { data, isLoading } = useCoachDashboard()
 * const { clients, recentSessions, activeCommitments } = data
 */
export function useCoachDashboard() {
  // Fetch all clients
  const clientsQuery = useClients()

  // Fetch recent sessions (last 10)
  const sessionsQuery = useSessions({ per_page: 10 })

  // Fetch all active commitments
  const commitmentsQuery = useCommitments({ status: 'active' })

  const isLoading =
    clientsQuery.isLoading ||
    sessionsQuery.isLoading ||
    commitmentsQuery.isLoading

  const error =
    clientsQuery.error || sessionsQuery.error || commitmentsQuery.error

  return {
    data: {
      clients: clientsQuery.data?.clients ?? [],
      recentSessions: sessionsQuery.data?.sessions ?? [],
      activeCommitments: commitmentsQuery.data?.commitments ?? [],
      stats: {
        totalClients: clientsQuery.data?.total ?? 0,
        totalSessions: sessionsQuery.data?.total ?? 0,
        activeCommitments: commitmentsQuery.data?.total ?? 0,
      },
    },
    isLoading,
    error,
    refetch: () => {
      clientsQuery.refetch()
      sessionsQuery.refetch()
      commitmentsQuery.refetch()
    },
  }
}
