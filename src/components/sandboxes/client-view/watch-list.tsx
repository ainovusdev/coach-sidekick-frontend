'use client'

import { Check } from 'lucide-react'
import { NeedsAttentionList } from '@/components/sandboxes/dashboard/needs-attention-list'
import type { ClientViewModel } from './client-view-model'

/**
 * The concerns a client would raise, derived rather than typed: coachees who
 * have slipped behind, coachees who have not started, and windows that are
 * open or about to be.
 *
 * Nothing internal is read here — our own notes and concerns about a sandbox
 * stay on our side of it — and the list is deliberately the dashboard's, so a
 * row reads the same wherever it is met.
 */
export function WatchList({
  model,
  limit,
  onSelect,
}: {
  model: ClientViewModel
  limit?: number
  onSelect: (section: string) => void
}) {
  if (!model.watch.length)
    return (
      <div
        className="flex items-start gap-2 text-sm text-ink-3"
        data-testid="watch-empty"
      >
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
        {model.life.kind === 'upcoming'
          ? 'The watch list fills in once coaching starts.'
          : `Nothing to watch on ${model.whole} right now.`}
      </div>
    )
  return (
    <NeedsAttentionList
      className="-mx-4 -my-3 rounded-none border-0"
      items={model.watch}
      showSandbox={false}
      limit={limit}
      onSelect={item => onSelect(item.section)}
    />
  )
}
