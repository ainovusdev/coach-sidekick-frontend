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

export function useResource(id: string) {
  return useQuery({
    queryKey: ['resource', id],
    queryFn: () => ResourceService.getResource(id),
    enabled: !!id,
  })
}

export function useResourceCategories() {
  return useQuery({
    queryKey: ['resource-categories'],
    queryFn: () => ResourceService.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}
