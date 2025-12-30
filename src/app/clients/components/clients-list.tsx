'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Client } from '@/types/meeting'
import ClientCard from './client-card'
import { Users, Plus, AlertCircle } from 'lucide-react'

interface ClientsListProps {
  myClients: Client[]
  assignedClients: Client[]
  loading: boolean
  error: string | null
  isViewer: boolean
  searchTerm: string
  onRefetch: () => void
  onClientClick: (clientId: string) => void
  onEditClient: (client: Client) => void
  onInviteClient: (client: Client) => void
  onCreateClient: () => void
}

export default function ClientsList({
  myClients,
  assignedClients,
  loading,
  error,
  isViewer,
  searchTerm,
  onRefetch,
  onClientClick,
  onEditClient,
  onInviteClient,
  onCreateClient,
}: ClientsListProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border border-gray-200 bg-white rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 bg-gray-100 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mt-2" />
                </div>
              </div>
              <div className="h-4 w-full bg-gray-50 rounded animate-pulse mt-4" />
              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="h-4 w-20 bg-gray-50 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-50 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border-0 bg-white rounded-xl shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load clients
          </h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button onClick={onRefetch} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (myClients.length === 0 && assignedClients.length === 0) {
    return (
      <Card className="border-0 bg-white rounded-xl shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No clients found' : 'No clients yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? 'Try adjusting your search or filters'
              : 'Add your first client to start tracking coaching relationships'}
          </p>
          {!isViewer && !searchTerm && (
            <Button onClick={onCreateClient}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-12">
      {/* My Clients Section */}
      {myClients.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">My Clients</h2>
            <span className="text-sm text-gray-500">({myClients.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                isAssigned={false}
                isViewer={isViewer}
                onView={() => onClientClick(client.id)}
                onEdit={() => onEditClient(client)}
                onInvite={() => onInviteClient(client)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Assigned Clients Section */}
      {assignedClients.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Assigned Clients
            </h2>
            <span className="text-sm text-blue-600">
              ({assignedClients.length})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                isAssigned={true}
                isViewer={isViewer}
                onView={() => onClientClick(client.id)}
                onEdit={() => onEditClient(client)}
                onInvite={() => onInviteClient(client)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
