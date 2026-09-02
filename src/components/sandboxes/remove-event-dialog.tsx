'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRemoveEvent } from '@/hooks/mutations/use-sandbox-mutations'
import { fmtWindow } from '@/lib/sandbox/format'
import type { TimelineEvent } from '@/types/sandbox'

export function RemoveEventDialog({
  event,
  onOpenChange,
  sandboxId,
}: {
  event: TimelineEvent | null
  onOpenChange: (open: boolean) => void
  sandboxId: string
}) {
  const remove = useRemoveEvent(sandboxId)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (event) setReason('')
  }, [event])

  if (!event) return null

  const submit = async () => {
    if (!reason.trim()) return
    await remove.mutateAsync({ eventId: event.id, reason: reason.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={!!event} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove {event.label}?</DialogTitle>
          <DialogDescription>
            {fmtWindow(event.window_start, event.window_end)}. It comes off the
            timeline but stays on record, so it can be restored and the timeline
            knows it was taken out on purpose.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="remove-reason">Why?</Label>
          <Textarea
            id="remove-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="No midpoint report on this contract."
            autoFocus
            data-testid="remove-reason"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep it
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || remove.isPending}
            onClick={submit}
            data-testid="remove-event-confirm"
          >
            {remove.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
