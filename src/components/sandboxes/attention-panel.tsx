'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { NeedsAttentionList } from '@/components/sandboxes/dashboard/needs-attention-list'
import { useSandboxAttention } from '@/hooks/queries/use-sandboxes'
import type { AttentionItem } from '@/types/sandbox-delivery'

/** How many rows Today shows before asking. */
const FIRST = 8

/**
 * What needs a look on this sandbox, at the top of Today.
 *
 * The same rows the dashboard shows across every sandbox, for this one — the
 * backend ranks them and writes the copy, so nothing is decided twice. A row
 * names a section rather than a URL: the page is already on this sandbox, so
 * clicking one switches tab and scrolls instead of navigating.
 */
export function AttentionPanel({
  sandboxId,
  onSelect,
}: {
  sandboxId: string
  onSelect: (item: AttentionItem) => void
}) {
  const { data, isLoading } = useSandboxAttention(sandboxId)
  const [expanded, setExpanded] = useState(false)
  const items = data ?? []
  // A busy sandbox can run to thirty rows; the urgent ones sort first, so the
  // rest wait behind one click rather than burying the whole tab.
  const shown = expanded ? items : items.slice(0, FIRST)

  return (
    <section className="space-y-3" data-testid="attention-panel">
      <h2 className="text-sm font-semibold text-ink">
        Needs you
        {items.length > 0 && (
          <span className="ml-1.5 font-normal text-ink-3">{items.length}</span>
        )}
      </h2>
      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : (
        <NeedsAttentionList
          items={shown}
          showSandbox={false}
          onSelect={onSelect}
        />
      )}
      {items.length > FIRST && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-xs font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline"
          data-testid="attention-more"
        >
          {expanded ? 'Show fewer' : `Show all ${items.length}`}
        </button>
      )}
    </section>
  )
}
