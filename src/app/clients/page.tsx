'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/page-layout'
import ClientList from '@/components/clients/client-list'

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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-3 text-slate-600 font-medium">
              Loading clients...
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClientList />
      </div>
    </PageLayout>
  )
}
