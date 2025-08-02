'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import PageLayout from '@/components/page-layout'
import ClientForm from '@/components/clients/client-form'
import { Client } from '@/types/meeting'
import { ClientService } from '@/services/client-service'

export default function NewClientPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
            <p className="mt-3 text-slate-600 font-medium">Loading...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  const handleSubmit = async (clientData: Partial<Client>) => {
    setLoading(true)
    setError(null)

    try {
      await ClientService.createClient({
        name: clientData.name || '',
        email: clientData.email,
        phone: clientData.phone,
        notes: clientData.notes,
        tags: clientData.tags,
      })

      // Success - redirect to clients list
      router.push('/clients')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/clients')
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Add New Client</h1>
          <p className="text-slate-600 mt-1">
            Create a new coaching client profile
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-300 rounded-lg bg-red-50">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <ClientForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={loading}
        />
      </div>
    </PageLayout>
  )
}
