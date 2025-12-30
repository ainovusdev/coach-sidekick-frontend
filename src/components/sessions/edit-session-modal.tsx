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

interface Session {
  id: string
  title?: string | null
  summary?: string | null
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
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
  })

  // Populate form when modal opens with session data
  useEffect(() => {
    if (open && session) {
      setFormData({
        title: session.title || '',
        summary: session.summary || '',
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
          summary: formData.summary.trim() || undefined,
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
            Update the session title and summary
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
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                placeholder="Brief summary of the session..."
                value={formData.summary}
                onChange={e =>
                  setFormData({ ...formData, summary: e.target.value })
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
