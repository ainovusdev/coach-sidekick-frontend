'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/page-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { usePermissions } from '@/contexts/permission-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Client } from '@/types/meeting'
import ClientModal from '@/components/clients/client-modal'
import { ClientInvitationModal } from '@/components/clients/client-invitation-modal'
import { useClientsData, SortBy } from './hooks/use-clients-data'
import ClientsFilters from './components/clients-filters'
import ClientsList from './components/clients-list'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ClientService } from '@/services/client-service'
import { queryKeys } from '@/lib/query-client'
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  X,
  ArrowUpDown,
  Info,
} from 'lucide-react'

export default function ClientsPage() {
  const router = useRouter()
  const permissions = usePermissions()
  const isViewer = permissions.isViewer()
  const queryClient = useQueryClient()

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Use the data hook
  const {
    myClients,
    assignedClients,
    coaches,
    isLoading,
    loadingCoaches,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    handleStatusFilter,
    selectedCoachId,
    selectedCoach,
    handleCoachFilter,
    hasActiveFilters,
    handleClearFilters,
    sortBy,
    setSortBy,
    refetch,
  } = useClientsData()

  // Update client mutation
  const updateMutation = useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: string
      data: Partial<Client>
    }) => ClientService.updateClient(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })

  const handleEditClient = async (clientData: Partial<Client>) => {
    if (!selectedClient) return
    await updateMutation.mutateAsync({
      clientId: selectedClient.id,
      data: {
        name: clientData.name,
        notes: clientData.notes,
      },
    })
  }

  const openEditModal = (client: Client) => {
    setSelectedClient(client)
    setIsEditModalOpen(true)
  }

  const openInviteModal = (client: Client) => {
    setSelectedClient(client)
    setIsInviteModalOpen(true)
  }

  return (
    <ProtectedRoute loadingMessage="Loading clients...">
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-900 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Clients
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {isViewer
                        ? 'View assigned clients and their information'
                        : 'Manage and track your coaching relationships'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isViewer && (
                    <Button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-gray-900 hover:bg-gray-800"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Client
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    disabled={isLoading}
                    title="Refresh"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                    />
                  </Button>
                </div>
              </div>

              {/* Viewer Notice */}
              {isViewer && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Viewer Access
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        You have read-only access to these assigned clients.
                        Contact your administrator to modify access levels.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search + Sort Row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or notes..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-white border-gray-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <Select
                value={sortBy}
                onValueChange={(value: SortBy) => setSortBy(value)}
              >
                <SelectTrigger className="w-[180px] h-11 bg-white">
                  <ArrowUpDown className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="sessions">Most Sessions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters */}
            <ClientsFilters
              statusFilter={statusFilter}
              onStatusFilter={handleStatusFilter}
              coaches={coaches}
              loadingCoaches={loadingCoaches}
              selectedCoachId={selectedCoachId}
              selectedCoach={selectedCoach}
              onCoachFilter={handleCoachFilter}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />

            {/* Clients List */}
            <ClientsList
              myClients={myClients}
              assignedClients={assignedClients}
              loading={isLoading}
              error={error}
              isViewer={isViewer}
              searchTerm={searchTerm}
              onRefetch={refetch}
              onClientClick={clientId => router.push(`/clients/${clientId}`)}
              onEditClient={openEditModal}
              onInviteClient={openInviteModal}
              onCreateClient={() => setIsCreateModalOpen(true)}
            />
          </div>
        </div>

        {/* Create Client Modal */}
        <ClientModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
          }}
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

        {/* Client Invitation Modal */}
        {selectedClient && (
          <ClientInvitationModal
            isOpen={isInviteModalOpen}
            onClose={() => {
              setIsInviteModalOpen(false)
              setSelectedClient(null)
            }}
            clientId={selectedClient.id}
            clientName={selectedClient.name}
            clientEmail={selectedClient.email}
            invitationStatus={selectedClient.invitation_status}
            onInvitationSent={() => refetch()}
          />
        )}
      </PageLayout>
    </ProtectedRoute>
  )
}
