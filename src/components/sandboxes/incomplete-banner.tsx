'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SandboxGroup } from '@/types/sandbox'

export function IncompleteBanner({
  groups,
  onFinish,
}: {
  groups: SandboxGroup[]
  onFinish: (group: SandboxGroup) => void
}) {
  const incomplete = groups.filter(g => !g.is_complete)
  if (incomplete.length === 0) return null
  const one = incomplete.length === 1

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-amber-token/30 bg-amber-token-bg px-5 py-4 sm:flex-row sm:items-center"
      role="status"
      data-testid="incomplete-banner"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-token" />
      <div className="flex-1 text-sm">
        <span className="font-medium text-ink">
          {one
            ? 'One group is incomplete'
            : `${incomplete.length} groups are incomplete`}
        </span>
        <span className="text-ink-2">
          {' '}
          — {one ? 'It' : 'They'} won’t schedule sessions or appear in reporting
          until the contract is filled in.
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="border-amber-token/40 bg-paper text-ink hover:bg-paper/80"
        onClick={() => onFinish(incomplete[0])}
        data-testid="banner-finish"
      >
        {one ? 'Finish it' : `Finish ${incomplete[0].display_name}`}
      </Button>
    </div>
  )
}
