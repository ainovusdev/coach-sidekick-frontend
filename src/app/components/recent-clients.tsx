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
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 h-full w-full">
        <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-6 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse w-full"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (clients.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            My Clients
          </h2>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              No clients yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Start building meaningful coaching relationships
            </p>
            <Button
              onClick={() => router.push('/clients')}
              className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900"
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
        <Card className="border border-gray-200 dark:border-gray-700 flex flex-col h-full w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-900 dark:bg-white rounded-lg">
                  <UserCircle className="h-5 w-5 text-white dark:text-gray-900" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    My Clients
                    <Badge className="bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                      {myClients.length}
                    </Badge>
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Clients you created and manage
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/clients')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
                  className="border-gray-300 dark:border-gray-600 hover:border-gray-900 dark:hover:border-gray-400"
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
