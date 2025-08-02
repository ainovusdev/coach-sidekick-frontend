'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import PageLayout from '@/components/page-layout'
import { Button } from '@/components/ui/button'
import ClientForm from '@/components/clients/client-form'
import { Client } from '@/types/meeting'
import { ClientService } from '@/services/client-service'
import { ArrowLeft, User } from 'lucide-react'

export default function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    params.then(({ clientId }) => {
      setClientId(clientId)
    })
  }, [params])

  const fetchClient = useCallback(async () => {
    if (!clientId) return
    
    setFetchLoading(true)
    setError(null)

    try {
      const client = await ClientService.getClient(clientId)
      setClient(client)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      )
    } finally {
      setFetchLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    // Redirect to auth if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/auth')
      return
    }

    if (!user || authLoading || !clientId) return

    fetchClient()
  }, [clientId, user, authLoading, router, fetchClient])

  const handleSubmit = async (clientData: Partial<Client>) => {
    if (!clientId) return
    
    setLoading(true)
    setError(null)

    try {
      await ClientService.updateClient(clientId, {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        notes: clientData.notes,
        tags: clientData.tags,
      })

      // Success - redirect to client detail page
      router.push(`/clients/${clientId}`)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (!clientId) return
    router.push(`/clients/${clientId}`)
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
            <Link href={clientId ? `/clients/${clientId}` : '/clients'}>
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
