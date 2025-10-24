'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

interface CoachRouteProps {
  children: React.ReactNode
}

export function CoachRoute({ children }: CoachRouteProps) {
  const { isAuthenticated, loading, roles } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Not logged in at all
        router.push('/auth')
      } else {
        // Check if user has coach, admin, super_admin, or viewer role
        const hasCoachAccess = roles.some(role =>
          ['coach', 'admin', 'super_admin', 'viewer'].includes(role),
        )

        if (!hasCoachAccess) {
          // User is logged in but only has client role
          // Redirect them to client portal
          router.push('/client-portal/dashboard')
        }
      }
    }
  }, [loading, isAuthenticated, roles, router])

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

  // Check if user has coach access
  const hasCoachAccess = roles.some(role =>
    ['coach', 'admin', 'super_admin', 'viewer'].includes(role),
  )

  if (!hasCoachAccess) {
    return null
  }

  return <>{children}</>
}
