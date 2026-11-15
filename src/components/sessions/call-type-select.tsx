'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUpdateSession } from '@/hooks/mutations/use-session-mutations'
import {
  CALL_TYPE_OPTIONS,
  callTypeLabel,
  isCoachingCall,
  type CallType,
} from '@/config/call-types'
import { cn } from '@/lib/utils'

interface CallTypeSelectProps {
  value: CallType
  onChange: (value: CallType) => void
  disabled?: boolean
  id?: string
  className?: string
}

/** Form field: which kind of call this session is. */
export function CallTypeSelect({
  value,
  onChange,
  disabled,
  id,
  className,
}: CallTypeSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={v => onChange(v as CallType)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className={className}
        data-testid="call-type-select"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CALL_TYPE_OPTIONS.map(o => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** One-line hint under the field. */
export function CallTypeHint({ value }: { value: CallType }) {
  return (
    <p className="text-xs text-ink-3">
      {isCoachingCall(value)
        ? 'Coaching calls are evaluated and get the pre- and post-session forms.'
        : 'Not evaluated, and no pre- or post-session forms are sent.'}
    </p>
  )
}

/** Read-only badge; renders nothing for a coaching call. */
export function CallTypeBadge({
  callType,
  className,
}: {
  callType?: string | null
  className?: string
}) {
  if (isCoachingCall(callType)) return null
  return (
    <Badge
      variant="outline"
      className={cn('border-line bg-surface-2 text-ink-2', className)}
      data-testid="call-type-badge"
    >
      {callTypeLabel(callType)}
    </Badge>
  )
}

/**
 * Inline chip that changes a session's call type in place (upcoming lists,
 * start-bot card, live page). Shows the type, coaching included, so it can be
 * retyped before the call ends and the post-session forms go out.
 */
export function CallTypeChip({
  sessionId,
  callType,
  disabled,
  className,
}: {
  sessionId: string
  callType?: string | null
  disabled?: boolean
  className?: string
}) {
  const updateSession = useUpdateSession()
  // Local copy so the chip updates at once, also where the parent holds the
  // value outside the query cache (the live meeting page); reverted on error.
  const [current, setCurrent] = useState<CallType>(
    (callType || 'coaching') as CallType,
  )
  useEffect(() => {
    setCurrent((callType || 'coaching') as CallType)
  }, [callType])

  const change = (next: CallType) => {
    if (next === current) return
    const previous = current
    setCurrent(next)
    updateSession.mutate(
      { sessionId, data: { call_type: next } },
      { onError: () => setCurrent(previous) },
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled || updateSession.isPending}
        className={cn(
          'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60',
          isCoachingCall(current)
            ? 'border-line text-ink-3 hover:bg-surface-2'
            : 'border-line bg-surface-2 text-ink-2 hover:bg-surface-3',
          className,
        )}
        onClick={e => e.stopPropagation()}
        aria-label={`Call type: ${callTypeLabel(current)}. Change`}
        data-testid="call-type-chip"
      >
        {callTypeLabel(current)}
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={e => e.stopPropagation()}>
        <DropdownMenuLabel className="text-xs text-ink-3">
          Call type
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CALL_TYPE_OPTIONS.map(o => (
          <DropdownMenuItem key={o.value} onSelect={() => change(o.value)}>
            <Check
              className={cn(
                'h-3.5 w-3.5',
                o.value === current ? 'opacity-100' : 'opacity-0',
              )}
            />
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
