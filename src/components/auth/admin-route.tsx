'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

interface AdminRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  requireSuperAdmin?: boolean
}

export function AdminRoute({ 
  children, 
  requiredRoles = ['admin', 'super_admin'],
  requireSuperAdmin = false 
}: AdminRouteProps) {
  const { isAuthenticated, loading, hasAnyRole, isSuperAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/auth')
      } else if (requireSuperAdmin && !isSuperAdmin()) {
        router.push('/unauthorized')
      } else if (!hasAnyRole(requiredRoles)) {
        router.push('/unauthorized')
      }
    }
  }, [isAuthenticated, loading, hasAnyRole, requiredRoles, requireSuperAdmin, isSuperAdmin, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!isAuthenticated || (!hasAnyRole(requiredRoles) && !requireSuperAdmin)) {
    return null
  }

  if (requireSuperAdmin && !isSuperAdmin()) {
    return null
  }

  return <>{children}</>
}