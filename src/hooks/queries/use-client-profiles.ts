import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { ApiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface ClientProfile {
  client_id: string
  name: string | null
  email: string | null
  coach_name: string | null
  is_active: boolean
}

/**
 * Every coaching profile the logged-in user owns as a coachee (Phase 5c).
 *
 * A user coached by more than one coach has several profiles; single-profile
 * users get a one-item list and the switcher renders nothing. ApiClient injects
 * the X-Active-Client header, so `is_active` reflects the current selection.
 */
export function useClientProfiles(
  options?: Omit<UseQueryOptions<ClientProfile[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: [...queryKeys.clientPortal.all, 'profiles'] as const,
    queryFn: () =>
      ApiClient.get(`${API_URL}/client-portal/profiles`) as Promise<
        ClientProfile[]
      >,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
