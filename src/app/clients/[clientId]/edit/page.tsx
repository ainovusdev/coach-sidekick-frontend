'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import PageLayout from '@/components/page-layout'
import { Button } from '@/components/ui/button'
import ClientForm from '@/components/clients/client-form'
import { Client } from '@/types/meeting'
import { ApiClient } from '@/lib/api-client'
import { ArrowLeft, User } from 'lucide-react'

export default function EditClientPage({
  params,
}: {
  params: { clientId: string }
}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Redirect to auth if not authenticated
    if (!authLoading && !user) {
      router.push('/auth')
      return
    }

    if (!user || authLoading) return

    fetchClient()
  }, [params.clientId, user, authLoading, router])

  const fetchClient = async () => {
    setFetchLoading(true)
    setError(null)

    try {
      const response = await ApiClient.get(`/api/clients/${params.clientId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch client details')
      }

      const data = await response.json()
      setClient(data.client)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      )
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (clientData: Partial<Client>) => {
    setLoading(true)
    setError(null)

    try {
      const response = await ApiClient.put(
        `/api/clients/${params.clientId}`,
        clientData,
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update client')
      }

      // Success - redirect to client detail page
      router.push(`/clients/${params.clientId}`)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/clients/${params.clientId}`)
  }

  if (authLoading || fetchLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-3 text-slate-600 font-medium">
              Loading client details...
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error || !client) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <User className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Client Not Found
            </h3>
            <p className="text-red-600 mb-6">
              {error || 'The requested client could not be found.'}
            </p>
            <Link href="/clients">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Clients
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/clients/${params.clientId}`}>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Client
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Edit Client</h1>
            <p className="text-slate-600 mt-1">
              Update {client.name}&apos;s information
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-300 rounded-lg bg-red-50">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <ClientForm
          client={client}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={loading}
        />
      </div>
    </PageLayout>
  )
}
