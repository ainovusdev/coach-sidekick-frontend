'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/page-layout'
import ClientList from '@/components/clients/client-list'
import { LoadingState } from '@/components/ui/loading-state'

export default function ClientsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect to auth if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/auth')
    return null
  }

  if (authLoading) {
    return (
      <PageLayout>
        <LoadingState message="Loading clients..." />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ClientList />
        </div>
      </div>
    </PageLayout>
  )
}
