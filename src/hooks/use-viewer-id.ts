'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

/**
 * The person the UI should call "you".
 *
 * Normally the signed-in user. While a super admin is viewing the coach
 * portal as a coach (sessionStorage `view_as_coach_id`, the same key the API
 * client turns into `X-View-As-Coach`), it is that coach — so "Assigned to
 * me", "You" chips and "for you" counts agree with the data the server
 * returns for them. The admin panel never impersonates, so it keeps the
 * real id there. Read in an effect so server and first client render match.
 */
export function useViewerId(): string | null {
  const { userId } = useAuth()
  const pathname = usePathname()
  const [viewAs, setViewAs] = useState<string | null>(null)
  useEffect(() => {
    if (pathname?.startsWith('/admin')) {
      setViewAs(null)
      return
    }
    try {
      setViewAs(sessionStorage.getItem('view_as_coach_id'))
    } catch {
      setViewAs(null)
    }
  }, [pathname])
  return viewAs || userId || null
}
