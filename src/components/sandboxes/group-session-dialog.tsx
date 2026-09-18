'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  addDays,
  format,
  isSameDay,
  isToday,
  isTomorrow,
  startOfDay,
} from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import { CalendarIcon, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateGroupSession,
  useScheduleGroupSession,
} from '@/hooks/mutations/use-group-session-mutations'
import { resolveTimeZone } from '@/lib/date-utils'
import { MeetingService } from '@/services/meeting-service'
import { cn } from '@/lib/utils'
import type { GroupDelivery } from '@/types/sandbox-delivery'

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = ['00', '15', '30', '45']

function quickDates() {
  const today = startOfDay(new Date())
  return [
    { label: 'Tomorrow', date: addDays(today, 1) },
    { label: format(addDays(today, 2), 'EEE, MMM d'), date: addDays(today, 2) },
    { label: format(addDays(today, 7), 'EEE, MMM d'), date: addDays(today, 7) },
  ]
}

function dateLabel(date: Date | undefined) {
  if (!date) return 'Pick a date'
  if (isToday(date)) return `Today, ${format(date, 'MMM d')}`
  if (isTomorrow(date)) return `Tomorrow, ${format(date, 'MMM d')}`
  return format(date, 'EEE, MMM d, yyyy')
}

/**
 * Start or schedule a session for a whole sandbox group.
 *
 * The roster is shown, not chosen: the group already says who is in it, and the
 * server resolves the client rows from the enrollments open that day. All this
 * dialog sends is the group.
 */
export function GroupSessionDialog({
  group,
  sandboxId,
  sandboxName,
  mode,
  onClose,
}: {
  group: GroupDelivery
  sandboxId: string
  sandboxName: string
  mode: 'start' | 'schedule'
  onClose: () => void
}) {
  const router = useRouter()
  const create = useCreateGroupSession()
  const schedule = useScheduleGroupSession()
  const [title, setTitle] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [day, setDay] = useState<Date | undefined>(undefined)
  const [hour, setHour] = useState('10')
  const [minute, setMinute] = useState('00')
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [startingBot, setStartingBot] = useState(false)
  const pills = useMemo(quickDates, [])
  const busy = create.isPending || schedule.isPending || startingBot
  const names = group.coachees.map(c => c.name || c.email)

  const instant = () => {
    if (!day) return null
    let h = parseInt(hour, 10)
    if (period === 'AM' && h === 12) h = 0
    if (period === 'PM' && h !== 12) h += 12
    const pad = (n: number) => String(n).padStart(2, '0')
    const wall = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(
      day.getDate(),
    )}T${pad(h)}:${minute}:00`
    return fromZonedTime(wall, resolveTimeZone()).toISOString()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const shared = {
      sandbox_id: sandboxId,
      sandbox_group_id: group.group_id,
      title: title.trim() || undefined,
      meeting_url: meetingUrl.trim() || undefined,
    }

    if (mode === 'schedule') {
      const scheduled_for = instant()
      if (!scheduled_for) return
      await schedule.mutateAsync({ ...shared, scheduled_for })
      onClose()
      return
    }

    const session = await create.mutateAsync(shared)
    onClose()
    if (!meetingUrl.trim()) {
      router.push(`/sessions/group/${session.id}`)
      return
    }
    try {
      setStartingBot(true)
      const bot = await MeetingService.createBot({
        meeting_url: meetingUrl.trim(),
        session_id: session.id,
        bot_name: title.trim() || group.display_name,
      })
      router.push(`/meeting/${bot.id}`)
    } catch {
      // The session exists either way — the recording is what failed.
      router.push(`/sessions/group/${session.id}`)
    } finally {
      setStartingBot(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" aria-hidden />
            {mode === 'start'
              ? 'Start group session'
              : 'Schedule group session'}
          </DialogTitle>
          <DialogDescription>
            {group.display_name} · {sandboxName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="mt-2 space-y-5">
          <div className="rounded-lg bg-surface-2 px-3 py-2 text-xs leading-relaxed text-ink-3">
            <span className="font-medium text-ink-2">
              {names.length === 1 ? '1 coachee' : `${names.length} coachees`}
            </span>{' '}
            · {names.join(', ')}
            <p className="mt-1">
              Counts toward {group.display_name}, {group.session_length_minutes}{' '}
              min each.
            </p>
          </div>

          {mode === 'schedule' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Date <span className="text-vermillion">*</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {pills.map(pill => (
                  <button
                    key={pill.label}
                    type="button"
                    onClick={() => setDay(pill.date)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                      day && isSameDay(day, pill.date)
                        ? 'border-line bg-ink text-ink-on-dark'
                        : 'border-line bg-surface-1 text-ink-3 hover:border-line-strong hover:text-ink',
                    )}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="justify-start gap-2"
                    >
                      <CalendarIcon className="h-4 w-4" aria-hidden />
                      {dateLabel(day)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={day}
                      onSelect={picked => {
                        setDay(picked)
                        setCalendarOpen(false)
                      }}
                      disabled={date => date < startOfDay(new Date())}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-1">
                  <Select value={hour} onValueChange={setHour}>
                    <SelectTrigger className="w-[70px]" aria-label="Hour">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map(h => (
                        <SelectItem key={h} value={String(h)}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={minute} onValueChange={setMinute}>
                    <SelectTrigger className="w-[70px]" aria-label="Minute">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTES.map(m => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={period}
                    onValueChange={value => setPeriod(value as 'AM' | 'PM')}
                  >
                    <SelectTrigger className="w-[75px]" aria-label="AM or PM">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="group-session-url" className="text-sm font-medium">
              Meeting link{' '}
              <span className="font-normal text-ink-3">
                {mode === 'start' ? '· records the call' : '· optional'}
              </span>
            </Label>
            <Input
              id="group-session-url"
              value={meetingUrl}
              onChange={e => setMeetingUrl(e.target.value)}
              placeholder="https://zoom.us/j/…"
              data-testid="group-session-url"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="group-session-title"
              className="text-sm font-medium"
            >
              Title <span className="font-normal text-ink-3">· optional</span>
            </Label>
            <Input
              id="group-session-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={group.display_name}
              maxLength={255}
            />
          </div>

          {(create.isError || schedule.isError) && (
            <p role="alert" className="text-xs text-vermillion">
              {(create.error ?? schedule.error)?.message ||
                'That didn’t go through. Try again in a moment.'}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || (mode === 'schedule' && !day)}
              data-testid="group-session-submit"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {mode === 'start' ? 'Start session' : 'Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
