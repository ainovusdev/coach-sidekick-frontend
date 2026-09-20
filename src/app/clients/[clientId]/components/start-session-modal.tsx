'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MeetingFormSimple } from '@/components/meeting/meeting-form-simple'
import { MeetingService } from '@/services/meeting-service'
import type { SandboxAssignmentChoice } from '@/components/sandboxes/session-attribution'
import { toast } from 'sonner'

interface StartSessionModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
  /** The sandbox group this was opened from, so the coach is not asked again. */
  initialSandbox?: SandboxAssignmentChoice | null
}

export function StartSessionModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  initialSandbox,
}: StartSessionModalProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStartSession = async (
    meetingUrl: string,
    selectedClientId?: string,
    sandbox?: SandboxAssignmentChoice | null,
  ) => {
    setLoading(true)
    try {
      // Use the clientId from props, but allow override if provided in form
      const finalClientId = selectedClientId || clientId

      const response = await MeetingService.createBot({
        meeting_url: meetingUrl,
        client_id: finalClientId,
        sandbox_id: sandbox?.sandbox_id,
        sandbox_group_id: sandbox?.group_id,
      })

      if (response.id) {
        posthog.capture('session_started', {
          bot_id: response.id,
          client_id: finalClientId,
        })
        toast.success('Session bot created successfully!')
        // Navigate to the meeting page
        router.push(`/meeting/${response.id}`)
        onClose()
      } else {
        throw new Error('Failed to create bot')
      }
    } catch (error) {
      console.error('Error creating session bot:', error)
      toast.error('Failed to start session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start Live Session</DialogTitle>
          <DialogDescription>
            Start a live coaching session with {clientName}. Paste your meeting
            link below and we&apos;ll join with an AI bot to record and analyze
            the session.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <MeetingFormSimple
            onSubmit={handleStartSession}
            loading={loading}
            preselectedClientId={clientId}
            preselectedClientName={clientName}
            initialSandbox={initialSandbox}
          />
        </div>

        <div className="text-sm text-muted-foreground mt-2">
          <p className="font-semibold mb-1">Supported platforms:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Zoom</li>
            <li>Google Meet</li>
            <li>Microsoft Teams</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
