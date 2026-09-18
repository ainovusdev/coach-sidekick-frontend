'use client'

import { Zap } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { autoInfo } from '@/lib/commitments/automatic'
import { cn } from '@/lib/utils'
import type { Commitment } from '@/types/commitment'

/**
 * "Automatic" — the row was created by a rule, not a person. Hover (or
 * focus) for the one-sentence reason Coach Sidekick recorded when it did.
 */
export function AutomaticChip({
  commitment,
  className,
}: {
  commitment: Commitment
  className?: string
}) {
  const info = autoInfo(commitment)
  if (!info) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          data-testid="commitment-automatic"
          data-rule={info.rule}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border border-line bg-paper px-1.5 py-0.5',
            'text-[10px] font-medium uppercase tracking-wide text-ink-3',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent',
            className,
          )}
        >
          <Zap className="h-3 w-3" aria-hidden />
          Automatic
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs">
        {info.why}
      </TooltipContent>
    </Tooltip>
  )
}
