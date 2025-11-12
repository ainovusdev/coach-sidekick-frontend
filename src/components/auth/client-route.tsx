'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClientRouteProps {
  children: React.ReactNode
}

export function ClientRoute({ children }: ClientRouteProps) {
  const { isAuthenticated, loading, hasRole, signOut } = useAuth()
  const router = useRouter()

  const handleGoBackToSignIn = async () => {
    await signOut()
  }

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Only redirect to auth if not authenticated
      router.push('/auth')
    }
  }, [isAuthenticated, loading, router])

  // Don't redirect non-clients here - just don't show content
  // This prevents loops with the auth page

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Check if user has client role
  if (!hasRole('client')) {
    // Not a client - show friendly message instead of redirecting
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            You don&apos;t have access to the portal.
          </p>
          <p className="text-sm text-gray-500">
            Please contact your administrator.
          </p>
          <Button variant="outline" onClick={handleGoBackToSignIn}>
            Go back to sign in
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
