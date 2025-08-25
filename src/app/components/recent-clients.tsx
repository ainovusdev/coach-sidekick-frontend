import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SectionHeader } from '@/components/ui/section-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ClientCard } from '@/components/ui/client-card'
import { Client } from '@/types/meeting'
import { Users, Plus } from 'lucide-react'

interface RecentClientsProps {
  clients: Client[]
  clientsLoading: boolean
}

export default function RecentClients({ clients, clientsLoading }: RecentClientsProps) {
  const router = useRouter()

  return (
    <Card className="border-neutral-200">
      <CardHeader>
        <SectionHeader
          title="Recent Clients"
          action={{
            label: 'View All',
            onClick: () => router.push('/clients')
          }}
        />
      </CardHeader>
      <CardContent>
        {clientsLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-20 bg-neutral-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients yet"
            action={{
              label: 'Add Client',
              onClick: () => router.push('/clients'),
              icon: Plus
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {clients.map(client => (
              <ClientCard
                key={client.id}
                name={client.name}
                notes={client.notes}
                onClick={() => router.push(`/clients/${client.id}`)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}