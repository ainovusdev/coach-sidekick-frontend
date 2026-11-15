'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateSession } from '@/hooks/mutations/use-session-mutations'
import { Loader2 } from 'lucide-react'
import { CallTypeHint, CallTypeSelect } from './call-type-select'
import { DEFAULT_CALL_TYPE, type CallType } from '@/config/call-types'

interface Session {
  id: string
  title?: string | null
  summary?: string | null
  coach_notes?: string | null
  call_type?: string | null
}

interface EditSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
  onSuccess?: () => void
}

export function EditSessionModal({
  open,
  onOpenChange,
  session,
  onSuccess,
}: EditSessionModalProps) {
  const updateSession = useUpdateSession()
  const [formData, setFormData] = useState<{
    title: string
    coach_notes: string
    call_type: CallType
  }>({
    title: '',
    coach_notes: '',
    call_type: DEFAULT_CALL_TYPE,
  })

  // Populate form when modal opens with session data
  useEffect(() => {
    if (open && session) {
      setFormData({
        title: session.title || '',
        coach_notes: session.coach_notes || '',
        call_type: (session.call_type as CallType) || DEFAULT_CALL_TYPE,
      })
    }
  }, [open, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) return

    try {
      await updateSession.mutateAsync({
        sessionId: session.id,
        data: {
          title: formData.title.trim() || undefined,
          coach_notes: formData.coach_notes.trim() || undefined,
          // Only send a change: a retype stamps the server-side change time.
          call_type:
            formData.call_type !== (session.call_type || DEFAULT_CALL_TYPE)
              ? formData.call_type
              : undefined,
        },
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Failed to update session:', error)
    }
  }

  const handleClose = () => {
    if (!updateSession.isPending) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
          <DialogDescription>
            Update the session title, call type and notes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                placeholder="e.g., Weekly Check-in with John"
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                disabled={updateSession.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="call_type">Call type</Label>
              <CallTypeSelect
                id="call_type"
                value={formData.call_type}
                onChange={call_type => setFormData({ ...formData, call_type })}
                disabled={updateSession.isPending}
              />
              <CallTypeHint value={formData.call_type} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coach_notes">Note</Label>
              <Textarea
                id="coach_notes"
                placeholder="Add your notes about this session..."
                value={formData.coach_notes}
                onChange={e =>
                  setFormData({ ...formData, coach_notes: e.target.value })
                }
                rows={4}
                disabled={updateSession.isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateSession.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateSession.isPending}>
              {updateSession.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
