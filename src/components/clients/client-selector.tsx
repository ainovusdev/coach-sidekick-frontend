'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Client } from '@/types/meeting'
import { ApiClient } from '@/lib/api-client'

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
      const params = new URLSearchParams({
        status: 'active',
        limit: '10'
      })
      
      if (search.trim()) {
        params.append('search', search.trim())
      }

      const response = await ApiClient.get(`/api/clients?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSelectedClient = async (clientId: string) => {
    try {
      const response = await ApiClient.get(`/api/clients/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedClient(data.client)
      }
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer hover:border-gray-400 flex items-center justify-between"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                  {getClientInitials(selectedClient.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium">{selectedClient.name}</span>
                {selectedClient.company && (
                  <span className="text-sm text-gray-500 ml-2">@ {selectedClient.company}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {selectedClient.status}
              </Badge>
              {allowNone && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClientSelect(null)
                  }}
                  className="h-6 w-6 p-0 hover:bg-red-50"
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsOpen(true)}
            className="cursor-pointer"
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {!selectedClient && (
            <div className="p-2">
              <Input
                placeholder="Type to search clients..."
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus
                className="w-full"
              />
            </div>
          )}
          
          <div className="py-1">
            {allowNone && !selectedClient && (
              <div 
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b"
                onClick={() => handleClientSelect(null)}
              >
                <span className="text-gray-500 italic">No client selected</span>
              </div>
            )}
            
            {loading ? (
              <div className="px-3 py-4 text-center text-gray-500">
                Loading clients...
              </div>
            ) : clients.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500">
                {searchTerm ? 'No clients found' : 'No active clients'}
              </div>
            ) : (
              clients.map((client) => (
                <div 
                  key={client.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                  onClick={() => handleClientSelect(client)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      {getClientInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{client.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {client.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {client.company && client.email 
                        ? `${client.company} • ${client.email}`
                        : client.company || client.email || 'No additional info'
                      }
                    </div>
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