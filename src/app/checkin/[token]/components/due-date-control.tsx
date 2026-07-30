'use client'

/**
 * The reschedule affordance on a commitment row: a due-date button that opens a
 * "Move to…" popover.
 *
 * ONE popover with two panes (chips ⇄ calendar), never a popover inside a
 * popover — nesting means two Radix layers, two focus scopes, two dismiss
 * handlers, and outside-click behaviour that is genuinely flaky on touch.
 */

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Calendar as CalendarIcon, ChevronLeft, Loader2, X } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { CheckinCommitment } from '@/services/checkin-service'
import {
  dueLabel,
  quickDateOptions,
  spokenDate,
  toDateOnly,
} from '../utils/checkin-view'

const CheckinDateCalendar = dynamic(() => import('./checkin-date-calendar'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-[280px] grid place-items-center">
      <Loader2 className="h-5 w-5 animate-spin text-ink-4" />
    </div>
  ),
})

interface DueDateControlProps {
  item: CheckinCommitment
  pending: boolean
  onChange: (targetDate: string | null) => void
}

export function DueDateControl({
  item,
  pending,
  onChange,
}: DueDateControlProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'chips' | 'calendar'>('chips')

  const options = useMemo(() => quickDateOptions(), [])
  const label = dueLabel(item)
  const hasDate = !!item.target_date
  const days = hasDate ? item.target_date : null

  // Completed rows show the date as plain text. Rescheduling something already
  // done is meaningless — and the backend 409s it — while un-completing is one
  // tap away on the circle. Do not "fix" this into an enabled control.
  if (item.completed) {
    return <span className="text-xs text-ink-4">{label}</span>
  }

  const overdue = label.includes('overdue')
  const dueToday = label === 'Due today'

  const commit = (targetDate: string | null) => {
    setOpen(false)
    setView('chips')
    onChange(targetDate)
  }

  return (
    <Popover
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (!next) setView('chips')
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={pending}
          aria-haspopup="dialog"
          aria-label={`Change due date for "${item.title}" — currently ${spokenDate(days)}`}
          className={cn(
            'inline-flex items-center gap-1.5 h-9 -ml-2 px-2 rounded-lg text-xs',
            'transition-colors cursor-pointer hover:bg-surface-2 active:bg-surface-3',
            'disabled:opacity-50 disabled:pointer-events-none',
            overdue && 'text-vermillion font-medium',
            dueToday && 'text-amber-token font-medium',
            !overdue && !dueToday && hasDate && 'text-ink-3',
            // No date reads as an invitation, not an absence.
            !hasDate && 'text-ink-4 border border-dashed border-line-strong',
          )}
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <CalendarIcon className="h-3 w-3" />
          )}
          {label}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[280px] p-2"
        align="start"
        role="dialog"
        aria-label="Move due date"
      >
        {view === 'chips' ? (
          <div role="group" aria-label="Quick dates">
            <p className="px-2 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-4">
              Move to…
            </p>
            {options.map(option => {
              const selected = item.target_date === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => commit(option.value)}
                  className={cn(
                    'w-full min-h-[44px] px-2 rounded-lg flex items-center justify-between',
                    'text-sm transition-colors cursor-pointer',
                    selected
                      ? 'bg-ink text-paper font-medium'
                      : 'text-ink hover:bg-surface-2',
                  )}
                >
                  <span>{option.label}</span>
                  <span
                    className={cn(
                      'text-xs',
                      selected ? 'text-paper/70' : 'text-ink-4',
                    )}
                  >
                    {option.hint}
                  </span>
                </button>
              )
            })}

            <div className="my-1 border-t border-line" />

            <button
              type="button"
              onClick={() => setView('calendar')}
              className="w-full min-h-[44px] px-2 rounded-lg flex items-center gap-2 text-sm text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <CalendarIcon className="h-4 w-4 text-ink-3" />
              Pick a date…
            </button>

            {hasDate && (
              <button
                type="button"
                onClick={() => commit(null)}
                className="w-full min-h-[44px] px-2 rounded-lg flex items-center gap-2 text-sm text-ink-3 hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
                Clear due date
              </button>
            )}
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setView('chips')}
              className="min-h-[36px] px-1 mb-1 inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <CheckinDateCalendar
              value={item.target_date}
              onSelect={date => commit(toDateOnly(date))}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
