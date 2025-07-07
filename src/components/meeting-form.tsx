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

interface MeetingFormProps {
  onSubmit: (meetingUrl: string) => void
  loading: boolean
}

export function MeetingForm({ onSubmit, loading }: MeetingFormProps) {
  const [meetingUrl, setMeetingUrl] = useState('')
  const [error, setError] = useState('')

  const validateUrl = (url: string) => {
    const zoomRegex = /^https:\/\/.*zoom\.us\/j\/\d+/
    const meetRegex = /^https:\/\/meet\.google\.com\/[a-z0-9-]+/
    const teamsRegex = /^https:\/\/teams\.microsoft\.com/

    return zoomRegex.test(url) || meetRegex.test(url) || teamsRegex.test(url)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!meetingUrl.trim()) {
      setError('Please enter a meeting URL')
      return
    }

    if (!validateUrl(meetingUrl.trim())) {
      setError('Please enter a valid Zoom, Google Meet, or Teams meeting URL')
      return
    }

    onSubmit(meetingUrl.trim())
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
