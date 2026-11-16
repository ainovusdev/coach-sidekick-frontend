'use client'

import { useQuery } from '@tanstack/react-query'
import { ResourceService } from '@/services/resource-service'
import type { ResourceFilters } from '@/types/resource'

export function useResources(filters?: ResourceFilters) {
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: () => ResourceService.listResources(filters),
  })
}

/** A coachee's shared uploads, for the coach's client tab / session panel. */
export function useClientUploads(
  filters: { client_id?: string; session_id?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['client-uploads', filters],
    queryFn: () => ResourceService.listClientUploads(filters),
    enabled:
      (options?.enabled ?? true) && !!(filters.client_id || filters.session_id),
  })
}
