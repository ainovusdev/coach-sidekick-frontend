'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Client, ClientSessionStats } from '@/types/meeting'
import { ClientService } from '@/services/client-service'
import ClientModal from './client-modal'
import {
  Search,
  Plus,
  Users,
  Eye,
  Edit,
  Calendar,
  Clock,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ClientWithStats extends Client {
  client_session_stats?: ClientSessionStats[]
}

export default function ClientList() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)

      const response = await ClientService.listClients()

      setClients(response.clients)
      setError(null)
    } catch (error) {
      console.error('Error fetching clients:', error)
      setError('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const handleSearch = () => {
    fetchClients()
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleCreateClient = async (clientData: Partial<Client>) => {
    try {
      await ClientService.createClient({
        name: clientData.name || '',
        notes: clientData.notes,
      })
      fetchClients() // Refresh the list
    } catch (error) {
      console.error('Error creating client:', error)
      throw error
    }
  }

  const handleEditClient = async (clientData: Partial<Client>) => {
    if (!selectedClient) return

    try {
      await ClientService.updateClient(selectedClient.id, {
        name: clientData.name,
        notes: clientData.notes,
      })
      fetchClients() // Refresh the list
    } catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  }

  const openEditModal = (client: Client) => {
    setSelectedClient(client)
    setIsEditModalOpen(true)
  }

  const getClientInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatLastSession = (dateString?: string) => {
    if (!dateString) return 'No sessions'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-neutral-100 rounded animate-pulse" />
          <div className="h-10 w-32 bg-neutral-100 rounded animate-pulse" />
        </div>

        {/* Search Skeleton */}
        <div className="h-10 bg-neutral-100 rounded animate-pulse" />

        {/* Grid Skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-neutral-100 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {/* Minimal Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Clients</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Manage your coaching clients
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Client
          </Button>
        </div>

        {/* Clean Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 bg-white border-neutral-200 focus:border-neutral-400 focus:ring-0"
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <p className="text-sm text-neutral-600">{error}</p>
          </div>
        )}

        {/* Client List */}
        {clients.length === 0 ? (
          <Card className="border-neutral-200">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-neutral-400" />
              </div>
              <h3 className="text-base font-medium text-neutral-900 mb-2">
                No clients yet
              </h3>
              <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
                Add your first client to start tracking coaching sessions.
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Client
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {clients.map(client => {
              const stats = client.client_session_stats?.[0]

              return (
                <Card
                  key={client.id}
                  className="border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="h-10 w-10 bg-neutral-100 border border-neutral-200">
                          <AvatarFallback className="bg-white text-neutral-700 text-sm font-medium">
                            {getClientInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-neutral-900 text-base">
                            {client.name}
                          </h3>
                          {client.notes && (
                            <div className="flex items-center gap-1 mt-1">
                              <FileText className="h-3 w-3 text-neutral-400" />
                              <p className="text-sm text-neutral-500 truncate max-w-md">
                                {client.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        {stats && (
                          <div className="hidden sm:flex items-center gap-6 text-sm text-neutral-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{stats.total_sessions} sessions</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>
                                {formatLastSession(stats.last_session_date)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                          onClick={e => {
                            e.stopPropagation()
                            router.push(`/clients/${client.id}`)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                          onClick={e => {
                            e.stopPropagation()
                            openEditModal(client)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-neutral-300 ml-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      <ClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateClient}
        mode="create"
      />

      {/* Edit Client Modal */}
      <ClientModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedClient(null)
        }}
        onSubmit={handleEditClient}
        client={selectedClient}
        mode="edit"
      />
    </>
  )
}
