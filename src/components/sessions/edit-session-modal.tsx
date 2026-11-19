'use client'

import { useState, useEffect } from 'react'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
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
import { resolveTimeZone } from '@/lib/date-utils'
import { Loader2 } from 'lucide-react'
import { CallTypeHint, CallTypeSelect } from './call-type-select'
import { DEFAULT_CALL_TYPE, type CallType } from '@/config/call-types'

interface Session {
  id: string
  title?: string | null
  summary?: string | null
  coach_notes?: string | null
  call_type?: string | null
  session_type?: string | null
  started_at?: string | null
}

interface EditSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
  onSuccess?: () => void
}

// A time left blank lands at midday, so the calendar day survives any zone.
const DEFAULT_TIME = '12:00'

function parseInstant(value: string): Date {
  // The API sends naive UTC for some rows; treat a missing offset as UTC.
  return new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`)
}

/**
 * The date/time fields for a session start. Uploads are created from a bare
 * date, stored as midnight UTC: that is a calendar day, not an instant, so it
 * is read as the UTC day with no time (in a negative-offset zone the instant
 * would read as the evening before).
 */
export function startFields(
  startedAt: string | null | undefined,
  tz: string,
): { date: string; time: string } {
  if (!startedAt) return { date: '', time: '' }
  const d = parseInstant(startedAt)
  if (isNaN(d.getTime())) return { date: '', time: '' }
  const bareDay =
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  if (bareDay) return { date: d.toISOString().slice(0, 10), time: '' }
  return {
    date: formatInTimeZone(d, tz, 'yyyy-MM-dd'),
    time: formatInTimeZone(d, tz, 'HH:mm'),
  }
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
    date: string
    time: string
  }>({
    title: '',
    coach_notes: '',
    call_type: DEFAULT_CALL_TYPE,
    date: '',
    time: '',
  })
  const [initialStart, setInitialStart] = useState({ date: '', time: '' })
  const [dateError, setDateError] = useState<string | null>(null)

  // Only uploads can be re-dated: a recorded meeting's time is the recording's.
  const canRedate = session?.session_type === 'manual' && !!session?.started_at
  const tz = resolveTimeZone()
  const today = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd')

  // Populate form when modal opens with session data
  useEffect(() => {
    if (open && session) {
      const start = startFields(session.started_at, resolveTimeZone())
      setInitialStart(start)
      setDateError(null)
      setFormData({
        title: session.title || '',
        coach_notes: session.coach_notes || '',
        call_type: (session.call_type as CallType) || DEFAULT_CALL_TYPE,
        date: start.date,
        time: start.time,
      })
    }
  }, [open, session])

  /** ISO start to send, `undefined` for no change, or `null` if invalid. */
  const newStartedAt = (): string | undefined | null => {
    if (!canRedate) return undefined
    if (
      formData.date === initialStart.date &&
      formData.time === initialStart.time
    ) {
      return undefined
    }
    if (!formData.date) {
      setDateError('Pick the day the session took place')
      return null
    }
    const start = fromZonedTime(
      `${formData.date}T${formData.time || DEFAULT_TIME}:00`,
      tz,
    )
    if (isNaN(start.getTime())) {
      setDateError('That date is not valid')
      return null
    }
    const now = new Date()
    if (start > now) {
      // Today with no time: midday may not have come yet, so use now.
      if (!formData.time && formData.date === today) return now.toISOString()
      setDateError("That time hasn't happened yet")
      return null
    }
    return start.toISOString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) return

    const started_at = newStartedAt()
    if (started_at === null) return

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
          started_at,
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
            {canRedate
              ? 'Update the session title, date, call type and notes'
              : 'Update the session title, call type and notes'}
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

            {canRedate && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_9rem] gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="session_date">Session date</Label>
                    <Input
                      id="session_date"
                      type="date"
                      max={today}
                      value={formData.date}
                      onChange={e => {
                        setDateError(null)
                        setFormData({ ...formData, date: e.target.value })
                      }}
                      disabled={updateSession.isPending}
                      aria-invalid={!!dateError}
                      aria-describedby="session_date_hint"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session_time">
                      Time{' '}
                      <span className="text-ink-3 font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="session_time"
                      type="time"
                      value={formData.time}
                      onChange={e => {
                        setDateError(null)
                        setFormData({ ...formData, time: e.target.value })
                      }}
                      disabled={updateSession.isPending}
                      aria-describedby="session_date_hint"
                    />
                  </div>
                </div>
                <p
                  id="session_date_hint"
                  className={
                    dateError
                      ? 'text-xs text-destructive'
                      : 'text-xs text-ink-3'
                  }
                  role={dateError ? 'alert' : undefined}
                >
                  {dateError || 'When the uploaded call took place.'}
                </p>
              </div>
            )}

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
