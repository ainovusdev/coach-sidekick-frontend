import { Button } from '@/components/ui/button'
import { Filter, User, X } from 'lucide-react'

interface Client {
  id: string
  name: string
  email?: string
  company?: string
}

interface ClientFilterProps {
  clients: Client[]
  loadingClients: boolean
  selectedClientId: string | null
  selectedClient: Client | undefined
  onClientFilter: (clientId: string | null) => void
}

export default function ClientFilter({
  clients,
  loadingClients,
  selectedClientId,
  selectedClient,
  onClientFilter,
}: ClientFilterProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">
            Filter by client:
          </span>
        </div>

        {!loadingClients && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={selectedClientId === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => onClientFilter(null)}
              className="text-xs"
            >
              All Clients
            </Button>
            {clients.map(client => (
              <Button
                key={client.id}
                variant={
                  selectedClientId === client.id ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => onClientFilter(client.id)}
                className="text-xs"
              >
                <User className="h-3 w-3 mr-1" />
                {client.name}
              </Button>
            ))}
          </div>
        )}

        {selectedClient && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClientFilter(null)}
            className="text-slate-500 hover:text-slate-700 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear filter
          </Button>
        )}
      </div>

      {selectedClient && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Showing sessions for: {selectedClient.name}
            </span>
            {selectedClient.company && (
              <span className="text-xs text-blue-600">
                • {selectedClient.company}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}