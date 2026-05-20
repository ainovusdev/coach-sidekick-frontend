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
      <Card className="bg-surface-1 border border-line h-full w-full">
        <CardHeader className="pb-4 border-b border-line ">
          <div className="h-6 w-32 bg-surface-3 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="h-20 bg-surface-3 rounded-lg animate-pulse w-full"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show empty state when the coach has no owned clients. Users who only
  // see clients via ClientAccess (assigned clients or their own client-portal
  // profile) also land here, because the dashboard "My Clients" card is
  // scoped to clients they own.
  if (myClients.length === 0) {
    return (
      <Card className="bg-surface-1 border border-line ">
        <CardHeader className="border-b border-line pb-4">
          <h2 className="text-lg font-semibold text-ink ">My Clients</h2>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-3 rounded-full mb-4">
              <Users className="h-8 w-8 text-ink-4" />
            </div>
            <h3 className="text-base font-semibold text-ink mb-2">
              No clients yet
            </h3>
            <p className="text-sm text-ink-3 mb-6">
              Start building meaningful coaching relationships
            </p>
            <Button
              onClick={() => router.push('/clients')}
              className="bg-ink hover:bg-ink-2 text-ink-on-dark "
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
        <Card className="border border-line flex flex-col h-full w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-ink rounded-lg">
                  <UserCircle className="h-5 w-5 text-ink-on-dark " />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink flex items-center gap-2">
                    My Clients
                    <Badge className="bg-ink text-ink-on-dark ">
                      {myClients.length}
                    </Badge>
                  </h3>
                  <p className="text-sm text-ink-3 ">
                    Clients you created and manage
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/clients')}
                className="text-ink-3 hover:text-ink "
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
                  lastSessionDate={client.last_session_date}
                />
              ))}
            </div>
            {myClients.length > 6 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/clients')}
                  className="border-line-strong hover:border-line "
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
