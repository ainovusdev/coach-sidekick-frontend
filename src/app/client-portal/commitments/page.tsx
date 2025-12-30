'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

/**
 * Redirect to the new My Commitments page with board view
 */
export default function ClientCommitmentsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/client-portal/my-commitments')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner />
    </div>
  )
}
