import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ClientCard } from '@/components/ui/client-card'
import { SimpleClient } from '@/services/client-service'
import { Users, Plus, UserCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMemo } from 'react'

interface RecentClientsProps {
  clients: SimpleClient[]
  clientsLoading: boolean
}

export default function RecentClients({
  clients,
  clientsLoading,
}: RecentClientsProps) {
  const router = useRouter()

  // Only show owned clients on dashboard (assigned shown on /clients page)
  const myClients = useMemo(() => {
    return clients.filter(c => c.is_my_client !== false)
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
      <Card className="bg-white border border-gray-200">
        <CardHeader className="border-b border-gray-200 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Clients</h2>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              No clients yet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Start building meaningful coaching relationships
            </p>
            <Button
              onClick={() => router.push('/clients')}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Add Your First Client
              <Plus className="h-4 w-4 ml-2" />
            </Button>
          </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </div>
  )
}
