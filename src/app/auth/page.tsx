'use client'

import { useAuth } from '@/contexts/auth-context'
import { AuthForm } from '@/components/auth/auth-form'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthPage() {
  const { isAuthenticated, loading, roles } = useAuth()
  const router = useRouter()

  // Smart redirect for already-authenticated users
  useEffect(() => {
    if (isAuthenticated && !loading) {
      // Redirect based on roles to avoid loops
      const hasAdmin = roles.some(r => ['admin', 'super_admin'].includes(r))
      const hasCoach = roles.includes('coach')
      const hasClient = roles.includes('client')
      const isClientOnly = roles.length === 1 && hasClient

      if (hasAdmin) {
        router.push('/admin/dashboard')
      } else if (hasCoach) {
        router.push('/')
      } else if (isClientOnly) {
        router.push('/client-portal/dashboard')
      }
    }
  }, [isAuthenticated, loading, roles, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return <AuthForm />
}
