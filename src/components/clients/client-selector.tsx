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
            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-gray-900 cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-500 flex items-center justify-between"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <AvatarFallback className="bg-white dark:bg-gray-900 text-neutral-700 dark:text-neutral-300 text-sm">
                  {getClientInitials(selectedClient.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium text-neutral-900 dark:text-white">
                  {selectedClient.name}
                </span>
                {selectedClient.notes && (
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 ml-2 truncate max-w-[200px] inline-block align-middle">
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
                className="h-6 w-6 p-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
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
            className="cursor-pointer border-neutral-200 dark:border-neutral-700 focus:border-neutral-400 dark:focus:border-neutral-500 focus:ring-0"
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {!selectedClient && (
            <div className="p-2">
              <Input
                placeholder="Type to search clients..."
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus
                className="w-full border-neutral-200 dark:border-neutral-700 focus:border-neutral-400 dark:focus:border-neutral-500 focus:ring-0"
              />
            </div>
          )}

          {/* Add Client Option */}
          {onAddClient && (
            <div
              className="px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-700"
              onClick={() => {
                setIsOpen(false)
                onAddClient()
              }}
            >
              <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center">
                <Plus className="h-4 w-4 text-white dark:text-gray-900" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                Add new client
              </span>
            </div>
          )}

          <div className="py-1">
            {allowNone && !selectedClient && (
              <div
                className="px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer border-b border-neutral-100 dark:border-neutral-700"
                onClick={() => handleClientSelect(null)}
              >
                <span className="text-neutral-500 dark:text-neutral-400 italic">
                  No client selected
                </span>
              </div>
            )}

            {loading && clients.length === 0 ? (
              <div className="px-3 py-4 text-center text-neutral-500 dark:text-neutral-400">
                Loading clients...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="px-3 py-4 text-center text-neutral-500 dark:text-neutral-400">
                {searchTerm ? 'No clients found' : 'No clients available'}
              </div>
            ) : (
              filteredClients.map(client => (
                <div
                  key={client.id}
                  className="px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer flex items-center gap-3"
                  onClick={() => handleClientSelect(client as Client)}
                >
                  <Avatar className="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <AvatarFallback className="bg-white dark:bg-gray-900 text-neutral-700 dark:text-neutral-300 text-sm">
                      {getClientInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 dark:text-white truncate">
                        {client.name}
                      </span>
                    </div>
                    {client.email && (
                      <div className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
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
