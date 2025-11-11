import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ClientCard } from '@/components/ui/client-card'
import { Client } from '@/types/meeting'
import { Users, Plus, UserCheck, UserCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMemo } from 'react'

interface RecentClientsProps {
  clients: Client[]
  clientsLoading: boolean
}

export default function RecentClients({
  clients,
  clientsLoading,
}: RecentClientsProps) {
  const router = useRouter()

  // Separate clients into owned vs assigned
  const { myClients, assignedClients } = useMemo(() => {
    const my = clients.filter(c => c.is_my_client !== false)
    const assigned = clients.filter(c => c.is_my_client === false)
    return { myClients: my, assignedClients: assigned }
  }, [clients])

  if (clientsLoading) {
    return (
      <Card className="bg-white border border-gray-200 h-full w-full">
        <CardHeader className="pb-4 border-b border-gray-200">
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="h-20 bg-gray-100 rounded-lg animate-pulse w-full"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (clients.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="py-12">
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Start building meaningful coaching relationships"
            action={{
              label: 'Add Your First Client',
              onClick: () => router.push('/clients'),
              icon: Plus,
            }}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full flex flex-col w-full">
      {/* My Clients Section */}
      {myClients.length > 0 && (
        <Card className="border border-gray-200 flex flex-col h-full w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-900 rounded-lg">
                  <UserCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    My Clients
                    <Badge className="bg-gray-900 text-white">
                      {myClients.length}
                    </Badge>
                  </h3>
                  <p className="text-sm text-gray-500">
                    Clients you created and manage
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/clients')}
                className="text-gray-600 hover:text-gray-900"
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myClients.slice(0, 6).map(client => (
                <ClientCard
                  key={client.id}
                  name={client.name}
                  email={client.email}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  isMyClient={client.is_my_client}
                  coachName={client.coach_name}
                />
              ))}
            </div>
            {myClients.length > 6 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/clients')}
                  className="border-gray-300 hover:border-gray-900"
                >
                  View {myClients.length - 6} More Clients
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assigned Clients Section */}
      {assignedClients.length > 0 && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-900 rounded-lg">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Assigned Clients
                    <Badge className="bg-gray-900 text-white">
                      {assignedClients.length}
                    </Badge>
                  </h3>
                  <p className="text-sm text-gray-500">
                    Clients shared with you by other coaches
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/clients')}
                className="text-gray-600 hover:text-gray-900"
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignedClients.slice(0, 6).map(client => (
                <ClientCard
                  key={client.id}
                  name={client.name}
                  email={client.email}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  isMyClient={client.is_my_client}
                  coachName={client.coach_name}
                />
              ))}
            </div>
            {assignedClients.length > 6 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/clients')}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  View {assignedClients.length - 6} More Assigned Clients
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State for My Clients (if only have assigned) */}
      {myClients.length === 0 && assignedClients.length > 0 && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="py-8">
            <EmptyState
              icon={Users}
              title="No personal clients yet"
              description="You have access to assigned clients, but haven't created your own yet"
              action={{
                label: 'Create Your First Client',
                onClick: () => router.push('/clients'),
                icon: Plus,
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
