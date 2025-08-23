'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Link } from 'lucide-react'
import ClientSelector from '@/components/clients/client-selector'
import { Client } from '@/types/meeting'

interface MeetingFormSimpleProps {
  onSubmit: (meetingUrl: string, clientId?: string) => void | Promise<void>
  loading: boolean
}

export function MeetingFormSimple({ onSubmit, loading }: MeetingFormSimpleProps) {
  const [meetingUrl, setMeetingUrl] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <ClientSelector
          selectedClientId={selectedClient?.id}
          onClientSelect={setSelectedClient}
          placeholder="Select client (optional)"
          allowNone={true}
        />
      </div>

      <div className="relative">
        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          type="url"
          value={meetingUrl}
          onChange={e => setMeetingUrl(e.target.value)}
          placeholder="Paste meeting URL"
          className="pl-10 border-neutral-200 focus:border-neutral-400 focus:ring-0"
          disabled={loading}
        />
      </div>

      <Button
        type="submit"
        disabled={loading || !meetingUrl.trim() || !validateUrl(meetingUrl.trim())}
        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white"
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

      <p className="text-xs text-center text-neutral-400">
        Works with Zoom, Google Meet, and Teams
      </p>
    </form>
  )
}