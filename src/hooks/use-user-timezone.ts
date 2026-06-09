'use client'

import { useQuery } from '@tanstack/react-query'
import axios from '@/lib/axios-config'
import { useAuth } from '@/contexts/auth-context'

/**
 * Fetch the authenticated coach's saved IANA timezone from `/auth/me`.
 *
 * Returns `null` until resolved (or when disabled / unauthenticated), in which
 * case callers should fall back to the browser zone. The value is cached
 * indefinitely — the saved zone rarely changes within a session, and
 * `auth-context` already keeps it in sync with the browser on login.
 *
 * @param enabled - Skip the fetch entirely when false (e.g. client-portal /
 *   public surfaces that should use the browser zone, not the coach's).
 */
export function useUserTimezone(enabled: boolean = true): string | null {
  const { isAuthenticated } = useAuth()

  const { data } = useQuery({
    queryKey: ['auth', 'me', 'timezone'],
    queryFn: async (): Promise<string | null> => {
      const res = await axios.get('/auth/me')
      return (res.data?.timezone as string | null) ?? null
    },
    enabled: enabled && isAuthenticated,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })

  return data ?? null
}
