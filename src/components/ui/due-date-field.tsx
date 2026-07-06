'use client'

/**
 * DueDateField — a small optional, clearable date picker used by the Vision and
 * Outcome forms. Stores a date-only `yyyy-MM-dd` string (or null), matching the
 * codebase convention for `target_date` (see `src/lib/date-utils.ts`). Mirrors
 * the commitment detail panel's "Due Date" picker.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseDateForPicker, formatDateOnly } from '@/lib/date-utils'

interface DueDateFieldProps {
  value?: string | null
  onChange: (value: string | null) => void
  label?: string
  id?: string
}

export function DueDateField({
  value,
  onChange,
  label = 'Due date',
  id = 'due-date',
}: DueDateFieldProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              className={cn(
                'flex-1 justify-start text-left font-normal',
                !value && 'text-ink-3',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value
                ? formatDateOnly(value, 'MMM d, yyyy')
                : 'Set a date (optional)'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={parseDateForPicker(value ?? undefined)}
              onSelect={date => {
                onChange(date ? date.toISOString().split('T')[0] : null)
                setOpen(false)
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-ink-3"
            onClick={() => onChange(null)}
            aria-label="Clear due date"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
