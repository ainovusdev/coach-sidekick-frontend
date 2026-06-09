'use client'

import { useState } from 'react'
import { startOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { CalendarIcon, Clock, Loader2 } from 'lucide-react'
import {
  formatDate,
  formatRelativeTime,
  resolveTimeZone,
} from '@/lib/date-utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
// 5-minute granularity: 00, 05, 10, … 55
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, '0'),
)

interface ReschedulePopoverProps {
  scheduledFor: string | null
  isOverdue: boolean
  isPending: boolean
  onConfirm: (iso: string) => void
}

function seedFrom(scheduledFor: string | null, tz: string) {
  // Seed the calendar + time pickers from the instant rendered in the coach's
  // timezone (not the browser's), so the wall-clock shown matches what they see.
  const d = scheduledFor ? toZonedTime(new Date(scheduledFor), tz) : null
  const h24 = d ? d.getHours() : 10
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  const mins = d ? d.getMinutes() : 0
  // snap to nearest 5 (handles off-grid times from Google Calendar sync)
  const snapped = String((Math.round(mins / 5) % 12) * 5).padStart(2, '0')
  return {
    date: d || undefined,
    hour: String(h12),
    minute: snapped,
    period,
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/**
 * A reschedule control: click the date/time label to open a popover with a
 * calendar AND a time picker, then "Update" to save both at once. Used by the
 * dashboard and client-detail upcoming-session lists.
 */
export function ReschedulePopover({
  scheduledFor,
  isOverdue,
  isPending,
  onConfirm,
}: ReschedulePopoverProps) {
  const [open, setOpen] = useState(false)
  const tz = resolveTimeZone()
  const seed = seedFrom(scheduledFor, tz)
  const [date, setDate] = useState<Date | undefined>(seed.date)
  const [hour, setHour] = useState(seed.hour)
  const [minute, setMinute] = useState(seed.minute)
  const [period, setPeriod] = useState<'AM' | 'PM'>(seed.period)

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // re-seed from the latest scheduled value each time we open
      const s = seedFrom(scheduledFor, tz)
      setDate(s.date)
      setHour(s.hour)
      setMinute(s.minute)
      setPeriod(s.period)
    }
    setOpen(next)
  }

  const handleUpdate = () => {
    if (!date) return
    let h = parseInt(hour)
    if (period === 'AM' && h === 12) h = 0
    if (period === 'PM' && h !== 12) h += 12
    // Interpret the picked calendar day + time as wall-clock in the coach's
    // timezone, then convert to the absolute UTC instant.
    const wall = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}T${pad(h)}:${minute}:00`
    onConfirm(fromZonedTime(wall, tz).toISOString())
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1 text-xs shrink-0 hover:underline ${
            isOverdue ? 'text-vermillion' : 'text-ink-3 '
          }`}
          title="Click to reschedule"
        >
          <Clock className="h-3 w-3" />
          {scheduledFor
            ? `${formatDate(scheduledFor, 'MMM d, h:mm a')} (${formatRelativeTime(scheduledFor)})`
            : 'No date'}
          <CalendarIcon className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={d => d < startOfDay(new Date())}
          initialFocus
        />
        <div className="border-t border-line p-3 space-y-3">
          <div className="flex items-center gap-2">
            {/* Hour */}
            <Select value={hour} onValueChange={setHour}>
              <SelectTrigger className="w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {HOURS.map(h => (
                    <SelectItem key={h} value={String(h)}>
                      {String(h).padStart(2, '0')}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>

            <span className="text-lg font-medium text-muted-foreground">:</span>

            {/* Minute */}
            <Select value={minute} onValueChange={setMinute}>
              <SelectTrigger className="w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {MINUTES.map(m => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>

            {/* AM/PM toggle */}
            <div className="flex rounded-lg border border-input overflow-hidden">
              <button
                type="button"
                onClick={() => setPeriod('AM')}
                className={cn(
                  'px-3 py-2 text-sm font-medium transition-colors',
                  period === 'AM'
                    ? 'bg-ink text-ink-on-dark '
                    : 'bg-surface-1 text-ink-3 hover:text-ink ',
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setPeriod('PM')}
                className={cn(
                  'px-3 py-2 text-sm font-medium transition-colors',
                  period === 'PM'
                    ? 'bg-ink text-ink-on-dark '
                    : 'bg-surface-1 text-ink-3 hover:text-ink ',
                )}
              >
                PM
              </button>
            </div>
          </div>

          <Button
            size="sm"
            className="w-full"
            disabled={!date || isPending}
            onClick={handleUpdate}
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Updating…
              </>
            ) : (
              'Update'
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
