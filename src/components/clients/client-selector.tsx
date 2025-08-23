'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Client } from '@/types/meeting'
import { ClientService } from '@/services/client-service'
import { FileText } from 'lucide-react'

interface ClientSelectorProps {
  selectedClientId?: string
  onClientSelect: (client: Client | null) => void
  placeholder?: string
  allowNone?: boolean
}

export default function ClientSelector({ 
  selectedClientId, 
  onClientSelect, 
  placeholder = "Search and select a client...",
  allowNone = true
}: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const fetchClients = async (search: string = '') => {
    try {
      setLoading(true)
      
      const response = await ClientService.listClients({
        search: search.trim() || undefined,
        per_page: 20
      })
      
      // Use all clients since we no longer have status
      setClients(response.clients)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSelectedClient = async (clientId: string) => {
    try {
      const client = await ClientService.getClient(clientId)
      setSelectedClient(client)
    } catch (error) {
      console.error('Error fetching selected client:', error)
    }
  }

  useEffect(() => {
    if (selectedClientId && !selectedClient) {
      fetchSelectedClient(selectedClientId)
    }
  }, [selectedClientId, selectedClient])

  useEffect(() => {
    if (isOpen) {
      fetchClients(searchTerm)
    }
  }, [isOpen, searchTerm])

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
    return name.split(' ')
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
            className="w-full px-3 py-2 border border-neutral-200 rounded-md bg-white cursor-pointer hover:border-neutral-400 flex items-center justify-between"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 bg-neutral-100 border border-neutral-200">
                <AvatarFallback className="bg-white text-neutral-700 text-sm">
                  {getClientInitials(selectedClient.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium text-neutral-900">{selectedClient.name}</span>
                {selectedClient.notes && (
                  <span className="text-sm text-neutral-500 ml-2 truncate max-w-[200px] inline-block align-middle">
                    {selectedClient.notes}
                  </span>
                )}
              </div>
            </div>
            {allowNone && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleClientSelect(null)
                }}
                className="h-6 w-6 p-0 hover:bg-neutral-50 text-neutral-500"
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
            className="cursor-pointer border-neutral-200 focus:border-neutral-400 focus:ring-0"
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {!selectedClient && (
            <div className="p-2">
              <Input
                placeholder="Type to search clients..."
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus
                className="w-full border-neutral-200 focus:border-neutral-400 focus:ring-0"
              />
            </div>
          )}
          
          <div className="py-1">
            {allowNone && !selectedClient && (
              <div 
                className="px-3 py-2 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100"
                onClick={() => handleClientSelect(null)}
              >
                <span className="text-neutral-500 italic">No client selected</span>
              </div>
            )}
            
            {loading ? (
              <div className="px-3 py-4 text-center text-neutral-500">
                Loading clients...
              </div>
            ) : clients.length === 0 ? (
              <div className="px-3 py-4 text-center text-neutral-500">
                {searchTerm ? 'No clients found' : 'No clients available'}
              </div>
            ) : (
              clients.map((client) => (
                <div 
                  key={client.id}
                  className="px-3 py-2 hover:bg-neutral-50 cursor-pointer flex items-center gap-3"
                  onClick={() => handleClientSelect(client)}
                >
                  <Avatar className="h-8 w-8 bg-neutral-100 border border-neutral-200">
                    <AvatarFallback className="bg-white text-neutral-700 text-sm">
                      {getClientInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 truncate">{client.name}</span>
                    </div>
                    {client.notes && (
                      <div className="text-sm text-neutral-500 truncate flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {client.notes}
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
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}