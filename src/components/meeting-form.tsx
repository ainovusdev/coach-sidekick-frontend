'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Plus, Link, Loader2 } from 'lucide-react'
import ClientSelector from '@/components/clients/client-selector'
import { Client } from '@/types/meeting'

interface MeetingFormProps {
  onSubmit: (meetingUrl: string, clientId?: string) => void | Promise<void>
  loading: boolean
}

export function MeetingForm({ onSubmit, loading }: MeetingFormProps) {
  const [meetingUrl, setMeetingUrl] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [error, setError] = useState('')

  const validateUrl = (url: string) => {
    const zoomRegex = /^https:\/\/.*zoom\.us\/j\/\d+/
    const meetRegex = /^https:\/\/meet\.google\.com\/[a-z0-9-]+/
    const teamsRegex = /^https:\/\/teams\.microsoft\.com/

    return zoomRegex.test(url) || meetRegex.test(url) || teamsRegex.test(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Prevent double submission
    if (loading) {
      console.log('Form already submitting, ignoring duplicate')
      return
    }

    const trimmedUrl = meetingUrl.trim()

    if (!trimmedUrl) {
      setError('Please enter a meeting URL')
      return
    }

    if (!validateUrl(trimmedUrl)) {
      setError('Please enter a valid Zoom, Google Meet, or Teams meeting URL')
      return
    }

    try {
      await onSubmit(trimmedUrl, selectedClient?.id)
    } catch (error) {
      console.error('Form submission error:', error)
      // Error is handled by the parent component
    }
  }

  return (
    <Card>
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">Start Recording</CardTitle>
        <CardDescription>
          Enter your meeting link to begin transcription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="client" className="text-sm font-medium">
              Client (Optional)
            </label>
            <ClientSelector
              selectedClientId={selectedClient?.id}
              onClientSelect={setSelectedClient}
              placeholder="Select a client for this session..."
              allowNone={true}
            />
            <p className="text-xs text-muted-foreground">
              Associate this coaching session with a specific client
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="meeting-url" className="text-sm font-medium">
              Meeting URL
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="meeting-url"
                type="url"
                value={meetingUrl}
                onChange={e => setMeetingUrl(e.target.value)}
                placeholder="https://zoom.us/j/123456789"
                className="pl-10"
                disabled={loading}
              />
            </div>
            {error && (
              <div className="flex items-center space-x-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !meetingUrl.trim()}
            className="w-full"
            onClick={(e) => {
              // Ensure form submission even if enter key isn't working
              if (!loading && meetingUrl.trim()) {
                handleSubmit(e as any)
              }
            }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Bot...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Start Recording
              </>
            )}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2 justify-center pt-2 border-t">
          <Badge variant="outline" className="text-xs">
            Zoom
          </Badge>
          <Badge variant="outline" className="text-xs">
            Google Meet
          </Badge>
          <Badge variant="outline" className="text-xs">
            Microsoft Teams
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
