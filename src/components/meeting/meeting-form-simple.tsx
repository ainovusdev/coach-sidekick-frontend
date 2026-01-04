'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Link } from 'lucide-react'
import ClientSelector from '@/components/clients/client-selector'
import ClientModal from '@/components/clients/client-modal'
import { Client } from '@/types/meeting'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'

interface MeetingFormSimpleProps {
  onSubmit: (meetingUrl: string, clientId?: string) => void | Promise<void>
  loading: boolean
}

export function MeetingFormSimple({
  onSubmit,
  loading,
}: MeetingFormSimpleProps) {
  const [meetingUrl, setMeetingUrl] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const validateUrl = (url: string) => {
    const zoomRegex = /^https:\/\/.*zoom\.us\/j\/\d+/
    const meetRegex = /^https:\/\/meet\.google\.com\/[a-z0-9-]+/
    const teamsRegex = /^https:\/\/teams\.microsoft\.com/

    return zoomRegex.test(url) || meetRegex.test(url) || teamsRegex.test(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double submission
    if (loading) {
      return
    }

    const trimmedUrl = meetingUrl.trim()

    if (!trimmedUrl || !validateUrl(trimmedUrl)) {
      return
    }

    try {
      await onSubmit(trimmedUrl, selectedClient?.id)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <ClientSelector
            selectedClientId={selectedClient?.id}
            onClientSelect={setSelectedClient}
            placeholder="Select client (optional)"
            allowNone={true}
            onAddClient={() => setIsClientModalOpen(true)}
          />
        </div>

        <div className="relative">
          <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="url"
            value={meetingUrl}
            onChange={e => setMeetingUrl(e.target.value)}
            placeholder="Paste meeting URL (Zoom, Meet, or Teams)"
            className="pl-10"
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          disabled={
            loading || !meetingUrl.trim() || !validateUrl(meetingUrl.trim())
          }
          className="w-full bg-gray-900 hover:bg-gray-800 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            'Start Recording'
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          Works with Zoom, Google Meet, and Teams
        </p>
      </form>

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onClientCreated={newClient => {
          setSelectedClient(newClient)
          queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
        }}
        mode="create"
      />
    </>
  )
}
