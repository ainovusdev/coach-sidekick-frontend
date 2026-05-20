'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Client } from '@/types/meeting'
import { useClientsSimple, useClient } from '@/hooks/queries/use-clients'
import { SimpleClient } from '@/services/client-service'
import { Plus } from 'lucide-react'

interface ClientSelectorProps {
  selectedClientId?: string
  onClientSelect: (client: Client | null) => void
  placeholder?: string
  allowNone?: boolean
  onAddClient?: () => void
}

export default function ClientSelector({
  selectedClientId,
  onClientSelect,
  placeholder = 'Search and select a client...',
  allowNone = true,
  onAddClient,
}: ClientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Use lightweight clients query for fast loading
  const { data: clientsData, isLoading: loading } = useClientsSimple()
  const clients: SimpleClient[] = clientsData?.clients ?? []

  // Fetch selected client if provided (uses cache if available)
  const { data: fetchedSelectedClient } = useClient(
    selectedClientId && !selectedClient ? selectedClientId : undefined,
  )

  useEffect(() => {
    if (fetchedSelectedClient && !selectedClient) {
      setSelectedClient(fetchedSelectedClient)
    }
  }, [fetchedSelectedClient, selectedClient])

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients
    return clients.filter(
      client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [clients, searchTerm])

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client)
    onClientSelect(client)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const getClientInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        {selectedClient ? (
          <div
            className="w-full px-3 py-2 border border-line rounded-md bg-surface-1 cursor-pointer hover:border-line-strong flex items-center justify-between"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 bg-surface-3 border border-line ">
                <AvatarFallback className="bg-surface-1 text-ink-2 text-sm">
                  {getClientInitials(selectedClient.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium text-ink ">
                  {selectedClient.name}
                </span>
                {selectedClient.notes && (
                  <span className="text-sm text-ink-3 ml-2 truncate max-w-[200px] inline-block align-middle">
                    {selectedClient.notes}
                  </span>
                )}
              </div>
            </div>
            {allowNone && (
              <Button
                size="sm"
                variant="ghost"
                onClick={e => {
                  e.stopPropagation()
                  handleClientSelect(null)
                }}
                className="h-6 w-6 p-0 hover:bg-paper text-ink-3 "
              >
                ×
              </Button>
            )}
          </div>
        ) : (
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsOpen(true)}
            className="cursor-pointer border-line focus:border-line-strong focus:ring-0"
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-1 border border-line rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {!selectedClient && (
            <div className="p-2">
              <Input
                placeholder="Type to search clients..."
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus
                className="w-full border-line focus:border-line-strong focus:ring-0"
              />
            </div>
          )}

          {/* Add Client Option */}
          {onAddClient && (
            <div
              className="px-3 py-2.5 hover:bg-paper cursor-pointer flex items-center gap-2 border-b border-line "
              onClick={() => {
                setIsOpen(false)
                onAddClient()
              }}
            >
              <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center">
                <Plus className="h-4 w-4 text-ink-on-dark " />
              </div>
              <span className="font-medium text-ink ">Add new client</span>
            </div>
          )}

          <div className="py-1">
            {allowNone && !selectedClient && (
              <div
                className="px-3 py-2 hover:bg-paper cursor-pointer border-b border-line "
                onClick={() => handleClientSelect(null)}
              >
                <span className="text-ink-3 italic">No client selected</span>
              </div>
            )}

            {loading && clients.length === 0 ? (
              <div className="px-3 py-4 text-center text-ink-3 ">
                Loading clients...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="px-3 py-4 text-center text-ink-3 ">
                {searchTerm ? 'No clients found' : 'No clients available'}
              </div>
            ) : (
              filteredClients.map(client => (
                <div
                  key={client.id}
                  className="px-3 py-2 hover:bg-paper cursor-pointer flex items-center gap-3"
                  onClick={() => handleClientSelect(client as Client)}
                >
                  <Avatar className="h-8 w-8 bg-surface-3 border border-line ">
                    <AvatarFallback className="bg-surface-1 text-ink-2 text-sm">
                      {getClientInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink truncate">
                        {client.name}
                      </span>
                    </div>
                    {client.email && (
                      <div className="text-sm text-ink-3 truncate">
                        {client.email}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}
