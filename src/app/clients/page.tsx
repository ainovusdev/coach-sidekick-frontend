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
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { toast } from 'sonner'
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
  const [showCancelInviteDialog, setShowCancelInviteDialog] = useState(false)
  const [isCancellingInvite, setIsCancellingInvite] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const openCancelInvitationDialog = (client: Client) => {
    setSelectedClient(client)
    setShowCancelInviteDialog(true)
  }

  const openDeleteDialog = (client: Client) => {
    setSelectedClient(client)
    setShowDeleteDialog(true)
  }

  const handleDeleteClient = async () => {
    if (!selectedClient) return
    setIsDeleting(true)
    try {
      await ClientService.deleteClient(selectedClient.id)
      toast.success('Client deleted', {
        description: `${selectedClient.name} has been permanently deleted.`,
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      setShowDeleteDialog(false)
      setSelectedClient(null)
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client', {
        description:
          error instanceof Error ? error.message : 'Please try again later',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelInvitation = async () => {
    if (!selectedClient) return
    setIsCancellingInvite(true)
    try {
      await ClientService.cancelInvitation(selectedClient.id)
      toast.success('Invitation cancelled', {
        description: `Portal invitation for ${selectedClient.name} has been cancelled.`,
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      setShowCancelInviteDialog(false)
      setSelectedClient(null)
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast.error('Failed to cancel invitation', {
        description:
          error instanceof Error ? error.message : 'Please try again later',
      })
    } finally {
      setIsCancellingInvite(false)
    }
  }

  return (
    <ProtectedRoute loadingMessage="Loading clients...">
      <PageLayout>
        <div className="min-h-screen  ">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="bg-surface-1 rounded-2xl shadow-sm border border-line p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-ink rounded-xl">
                    <Users className="h-6 w-6 text-ink-on-dark" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-ink ">Clients</h1>
                    <p className="text-sm text-ink-3 mt-0.5">
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
                      className="bg-ink hover:bg-ink-2 "
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
                <div className="mt-4 p-4 bg-ds-accent-bg border border-ds-accent rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-ds-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-ds-accent ">
                        Viewer Access
                      </p>
                      <p className="text-sm text-ds-accent mt-1">
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-4" />
                <Input
                  placeholder="Search by name or notes..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-surface-1 border-line "
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-3 rounded-full"
                  >
                    <X className="h-4 w-4 text-ink-4" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <Select
                value={sortBy}
                onValueChange={(value: SortBy) => setSortBy(value)}
              >
                <SelectTrigger className="w-[180px] h-11 bg-surface-1 ">
                  <ArrowUpDown className="h-4 w-4 mr-2 text-ink-4" />
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
              onCancelInvitation={openCancelInvitationDialog}
              onDeleteClient={openDeleteDialog}
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
          }}
          onSubmit={handleEditClient}
          client={selectedClient}
          mode="edit"
        />

        {/* Client Invitation Modal */}
        <ClientInvitationModal
          isOpen={isInviteModalOpen}
          onClose={() => {
            setIsInviteModalOpen(false)
            setSelectedClient(null)
          }}
          clientId={selectedClient?.id || ''}
          clientName={selectedClient?.name || ''}
          clientEmail={selectedClient?.email}
          invitationStatus={selectedClient?.invitation_status}
          onInvitationSent={() => refetch()}
        />

        {/* Cancel Invitation Dialog */}
        <ConfirmationDialog
          open={showCancelInviteDialog}
          onOpenChange={open => {
            if (!isCancellingInvite) {
              setShowCancelInviteDialog(open)
            }
          }}
          title="Cancel Invitation"
          description={`Are you sure you want to cancel the portal invitation for ${selectedClient?.name}? They will no longer be able to accept the invitation.`}
          confirmText={
            isCancellingInvite ? 'Cancelling...' : 'Cancel Invitation'
          }
          variant="destructive"
          onConfirm={handleCancelInvitation}
        />

        {/* Delete Client Dialog */}
        <ConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={open => {
            if (!isDeleting) {
              setShowDeleteDialog(open)
            }
          }}
          title="Delete Client"
          description={`Permanently delete ${selectedClient?.name}? This will also delete all sessions, transcripts, insights, sprints, commitments, tasks, and portal access for this client. This cannot be undone.`}
          confirmText={isDeleting ? 'Deleting...' : 'Delete Client'}
          variant="destructive"
          onConfirm={handleDeleteClient}
        />
      </PageLayout>
    </ProtectedRoute>
  )
}
