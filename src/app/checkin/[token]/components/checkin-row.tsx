'use client'

import { forwardRef } from 'react'
import { Check, Loader2, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CheckinCommitment } from '@/services/checkin-service'
import { isOverdue } from '../utils/checkin-view'
import { DueDateControl } from './due-date-control'
import type { RowError } from '../hooks/use-checkin'

interface CheckinRowProps {
  item: CheckinCommitment
  pending: boolean
  error?: RowError
  highlighted: boolean
  onToggle: () => void
  onReschedule: (targetDate: string | null) => void
}

export const CheckinRow = forwardRef<HTMLDivElement, CheckinRowProps>(
  function CheckinRow(
    { item, pending, error, highlighted, onToggle, onReschedule },
    ref,
  ) {
    const overdue = isOverdue(item)

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start gap-2 p-3 min-h-[72px] bg-paper rounded-xl border transition-colors',
          overdue
            ? 'border-line border-l-2 border-l-vermillion'
            : 'border-line',
          // One-shot pulse for the email's deep link. A permanent ring would sit
          // there for the whole session fighting the overdue accent.
          highlighted && 'animate-[pulse_1s_ease-in-out_2] ring-2 ring-ink/20',
        )}
      >
        {/*
          44px touch target around a visually 24px circle — the mark stays small,
          the tappable area does not. Negative margin keeps the row compact.
        */}
        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          aria-pressed={item.completed}
          aria-label={
            item.completed
              ? `Mark "${item.title}" as not done`
              : `Mark "${item.title}" as done`
          }
          className="-m-1 h-11 w-11 flex-shrink-0 grid place-items-center rounded-full cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <span
            className={cn(
              'h-6 w-6 rounded-full border-2 grid place-items-center transition-all duration-200 motion-reduce:transition-none',
              item.completed
                ? 'bg-forest border-forest text-white scale-100'
                : 'border-line-strong hover:border-forest',
            )}
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-4" />
            ) : (
              item.completed && <Check className="h-4 w-4" />
            )}
          </span>
        </button>

        <div className="min-w-0 flex-1 pt-1.5">
          <p
            className={cn(
              'text-[15px] font-medium leading-snug',
              item.completed ? 'text-ink-4 line-through' : 'text-ink',
            )}
          >
            {item.title}
          </p>

          <div className="mt-0.5">
            <DueDateControl
              item={item}
              pending={pending}
              onChange={onReschedule}
            />
          </div>

          {/*
            Row-anchored and persistent. The toast is secondary — top-right on a
            scrolled mobile list, gone in five seconds, is exactly what made the
            old failure mode feel silent.
          */}
          {error && (
            <button
              type="button"
              onClick={error.retry}
              className="mt-1 inline-flex items-center gap-1.5 min-h-[32px] text-xs text-vermillion hover:underline cursor-pointer"
            >
              <RotateCw className="h-3 w-3" />
              {error.message} Retry
            </button>
          )}
        </div>
      </div>
    )
  },
)
