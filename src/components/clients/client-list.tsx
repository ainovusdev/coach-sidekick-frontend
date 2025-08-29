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
  ChevronRight,
  X,
  ArrowUpDown,
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
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'sessions'>('recent')

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
  }, [])

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

  // Sort and filter clients
  const getSortedClients = () => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.notes && client.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return filtered.sort((a, b) => {
      const statsA = a.client_session_stats?.[0]
      const statsB = b.client_session_stats?.[0]

      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'sessions':
          return (statsB?.total_sessions || 0) - (statsA?.total_sessions || 0)
        case 'recent':
        default:
          const dateA = statsA?.last_session_date ? new Date(statsA.last_session_date).getTime() : 0
          const dateB = statsB?.last_session_date ? new Date(statsB.last_session_date).getTime() : 0
          return dateB - dateA
      }
    })
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="h-9 w-32 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-5 w-48 bg-gray-100 rounded-lg animate-pulse mt-3" />
            </div>
            <div className="h-11 w-32 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-gray-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
                <div>
                  <div className="h-6 w-12 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search Skeleton */}
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />

        {/* Cards Skeleton */}
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="flex items-center">
                <div className="w-1 h-28 bg-gray-200" />
                <div className="flex-1 p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-full animate-pulse" />
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-2" />
                    </div>
                    <div className="hidden sm:flex gap-6">
                      <div className="h-10 w-16 bg-gray-100 rounded animate-pulse" />
                      <div className="h-10 w-24 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {/* Modern Header with Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
              <p className="text-base text-gray-500 mt-2">
                Manage and track your coaching relationships
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-5 py-2.5 transition-all hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                <p className="text-sm text-gray-500">Total Clients</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Calendar className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.reduce((acc, client) => acc + (client.client_session_stats?.[0]?.total_sessions || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Total Sessions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => {
                    const stats = c.client_session_stats?.[0]
                    if (!stats?.last_session_date) return false
                    const date = new Date(stats.last_session_date)
                    const daysDiff = Math.ceil((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
                    return daysDiff <= 7
                  }).length}
                </p>
                <p className="text-sm text-gray-500">Active This Week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4">
          {/* Enhanced Search Bar */}
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl opacity-50 group-hover:opacity-70 transition-opacity blur-xl" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name or notes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-100 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative group">
            <Button
              variant="outline"
              className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2 transition-all"
            >
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">
                {sortBy === 'name' ? 'Name' : sortBy === 'sessions' ? 'Sessions' : 'Recent'}
              </span>
            </Button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="p-1">
                <button
                  onClick={() => setSortBy('recent')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    sortBy === 'recent' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Most Recent
                </button>
                <button
                  onClick={() => setSortBy('name')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    sortBy === 'name' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Name (A-Z)
                </button>
                <button
                  onClick={() => setSortBy('sessions')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    sortBy === 'sessions' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Most Sessions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-5 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-red-900">Unable to load clients</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button 
                  onClick={fetchClients}
                  variant="outline"
                  size="sm"
                  className="mt-3 border-red-200 text-red-700 hover:bg-red-50"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Client List */}
        {clients.length === 0 ? (
          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <CardContent className="py-20 text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Welcome to Your Client Hub
              </h3>
              <p className="text-base text-gray-500 mb-8 max-w-md mx-auto">
                Start building meaningful coaching relationships. Add your first client to begin tracking sessions and progress.
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-6 py-3 transition-all hover:shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Client
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {getSortedClients().map(client => {
              const stats = client.client_session_stats?.[0]
              const isActive = stats?.last_session_date && 
                Math.ceil((Date.now() - new Date(stats.last_session_date).getTime()) / (1000 * 60 * 60 * 24)) <= 7

              return (
                <Card
                  key={client.id}
                  className="group border-0 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center">
                      {/* Left accent bar */}
                      <div className={`w-1 h-full ${isActive ? 'bg-gray-900' : 'bg-gray-200'}`} />
                      
                      <div className="flex-1 p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Enhanced Avatar */}
                            <div className="relative">
                              <Avatar className="h-12 w-12 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 text-base font-semibold">
                                  {getClientInitials(client.name)}
                                </AvatarFallback>
                              </Avatar>
                              {isActive && (
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-gray-900 rounded-full border-2 border-white" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-gray-900 text-lg group-hover:text-gray-700 transition-colors">
                                  {client.name}
                                </h3>
                                {isActive && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                    Active
                                  </span>
                                )}
                              </div>
                              {client.notes && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {client.notes}
                                </p>
                              )}
                              
                              {/* Mobile Stats */}
                              <div className="flex items-center gap-4 mt-3 sm:hidden">
                                {stats && (
                                  <>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                      <Calendar className="h-3.5 w-3.5" />
                                      <span>{stats.total_sessions} sessions</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span>{formatLastSession(stats.last_session_date)}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Desktop Stats */}
                            {stats && (
                              <div className="hidden sm:flex items-center gap-6">
                                <div className="flex flex-col">
                                  <span className="text-lg font-semibold text-gray-900">{stats.total_sessions}</span>
                                  <span className="text-xs text-gray-500">Sessions</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-700">
                                    {formatLastSession(stats.last_session_date)}
                                  </span>
                                  <span className="text-xs text-gray-500">Last session</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
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
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                              onClick={e => {
                                e.stopPropagation()
                                openEditModal(client)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <div className="ml-2 transform group-hover:translate-x-1 transition-transform">
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </div>
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
