'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ProfileRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'profile')
    router.replace(`/settings?${params.toString()}`)
  }, [router, searchParams])

  return null
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileRedirect />
    </Suspense>
  )
}
