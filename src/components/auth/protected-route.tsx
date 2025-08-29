'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { LoadingState } from '@/components/ui/loading-state'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  loadingMessage?: string
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/auth',
  loadingMessage = 'Loading...'
}: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [loading, isAuthenticated, router, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <LoadingState message={loadingMessage} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}