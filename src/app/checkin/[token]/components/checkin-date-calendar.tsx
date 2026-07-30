'use client'

/**
 * Dynamic-import boundary for the calendar.
 *
 * `react-day-picker` sits in no shared chunk today, and this page's median
 * session is "open from an email on mobile data, tap a circle, leave" — the
 * calendar is the minority path behind the quick chips, so it stays out of the
 * initial payload. Same pattern as `agent-modal.tsx`.
 */

import { Calendar } from '@/components/ui/calendar'
import { parseDateForPicker } from '@/lib/date-utils'

interface CheckinDateCalendarProps {
  value?: string | null
  onSelect: (date: Date) => void
}

export default function CheckinDateCalendar({
  value,
  onSelect,
}: CheckinDateCalendarProps) {
  return (
    <Calendar
      mode="single"
      // parseDateForPicker, never raw parseISO — it shifts the value so the
      // picker highlights the same calendar day the label shows.
      selected={parseDateForPicker(value ?? undefined)}
      onSelect={date => {
        if (date) onSelect(date)
      }}
      // Deliberately NOT disabling past dates. reschedule-popover.tsx does,
      // but that is for sessions; back-dating a commitment ("it was actually
      // due last Friday") is legitimate, and disabling the past would also grey
      // out the current selection of an overdue item, which reads as broken.
      initialFocus
    />
  )
}
