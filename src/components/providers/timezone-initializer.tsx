'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useUserTimezone } from '@/hooks/use-user-timezone'
import { setActiveTimeZone } from '@/lib/date-utils'

// Surfaces viewed by the client (or by anonymous users) — there the browser
// zone IS the right zone, so we must NOT pin the coach's saved zone.
const BROWSER_ZONE_PREFIXES = [
  '/client-portal',
  '/client-meeting',
  '/questionnaire',
  '/invitations',
]

/**
 * Populates the module-level "active" timezone used by `date-utils` INSTANT
 * formatters with the signed-in coach's saved IANA zone, so timestamps render
 * in the coach's timezone regardless of the browser's configured zone.
 *
 * On client/anonymous surfaces it resets the active zone to null so formatting
 * falls back to the browser zone (the viewer's own zone).
 */
export function TimezoneInitializer() {
  const pathname = usePathname()
  const isBrowserZoneSurface = BROWSER_ZONE_PREFIXES.some(
    prefix => pathname === prefix || pathname?.startsWith(`${prefix}/`),
  )

  const savedTz = useUserTimezone(!isBrowserZoneSurface)

  useEffect(() => {
    setActiveTimeZone(isBrowserZoneSurface ? null : savedTz)
  }, [isBrowserZoneSurface, savedTz])

  return null
}
