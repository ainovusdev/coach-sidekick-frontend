import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { CommitmentService } from '@/services/commitment-service'
import {
  Commitment,
  CommitmentFilters,
  CommitmentListResponse,
  CommitmentStats,
} from '@/types/commitment'
import { queryKeys } from '@/lib/query-client'

/**
 * Hook to fetch commitments list with optional filters
 *
 * Features:
 * - Cached for 3 minutes (more dynamic than sessions)
 * - Supports filtering by client, status, type
 * - Stale-while-revalidate strategy
 *
 * @param filters - Filter parameters for commitments
 * @param options - Additional react-query options
 *
 * @example
 * const { data, isLoading } = useCommitments({ client_id: '123', status: 'active' })
 * const commitments = data?.commitments ?? []
 */
export function useCommitments(
  filters?: CommitmentFilters,
  options?: Omit<
    UseQueryOptions<CommitmentListResponse>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.commitments.list(filters),
    queryFn: () => CommitmentService.listCommitments(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes (more dynamic than sessions)
    ...options,
  })
}

/**
 * Hook to fetch a single commitment by ID
 *
 * @param commitmentId - The commitment ID to fetch
 * @param options - Additional react-query options
 *
 * @example
 * const { data: commitment, isLoading } = useCommitment(commitmentId)
 */
export function useCommitment(
  commitmentId: string | undefined,
  options?: Omit<
    UseQueryOptions<Commitment>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: queryKeys.commitments.detail(commitmentId!),
    queryFn: () => CommitmentService.getCommitment(commitmentId!),
    enabled: !!commitmentId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  })
}

/**
 * Hook to fetch commitment statistics
 *
 * Useful for dashboard displays showing commitment completion rates, etc.
 *
 * @param clientId - Optional client ID to filter stats
 * @param options - Additional react-query options
 *
 * @example
 * const { data: stats } = useCommitmentStats(clientId)
 * console.log(`${stats.completed}/${stats.total} commitments completed`)
 */
export function useCommitmentStats(
  clientId?: string,
  options?: Omit<UseQueryOptions<CommitmentStats>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: [...queryKeys.commitments.all, 'stats', clientId],
    queryFn: () => CommitmentService.getStats(clientId),
    staleTime: 5 * 60 * 1000, // 5 minutes for stats
    ...options,
  })
}
