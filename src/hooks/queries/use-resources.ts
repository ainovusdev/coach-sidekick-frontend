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
