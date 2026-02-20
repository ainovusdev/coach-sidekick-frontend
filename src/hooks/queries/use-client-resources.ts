'use client'

import { useQuery } from '@tanstack/react-query'
import { ClientResourceService } from '@/services/client-resource-service'
import type { ClientResourceFilters } from '@/types/resource'

export function useClientResources(filters?: ClientResourceFilters) {
  return useQuery({
    queryKey: ['client-resources', filters],
    queryFn: () => ClientResourceService.listResources(filters),
  })
}

export function useClientResource(id: string) {
  return useQuery({
    queryKey: ['client-resource', id],
    queryFn: () => ClientResourceService.getResource(id),
    enabled: !!id,
  })
}
