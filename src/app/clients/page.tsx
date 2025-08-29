'use client'

import PageLayout from '@/components/layout/page-layout'
import ClientList from '@/components/clients/client-list'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function ClientsPage() {
  return (
    <ProtectedRoute loadingMessage="Loading clients...">
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <ClientList />
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}