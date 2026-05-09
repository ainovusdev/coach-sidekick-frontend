'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function IntegrationsRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Preserve OAuth callback params (calendar_connected, calendar_error, etc.)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'profile')
    router.replace(`/settings?${params.toString()}#integrations`)
  }, [router, searchParams])

  return null
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={null}>
      <IntegrationsRedirect />
    </Suspense>
  )
}
