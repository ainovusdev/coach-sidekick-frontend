'use client'

import { useMemo, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { NeedsAttentionList } from '@/components/sandboxes/dashboard/needs-attention-list'
import { Section } from '@/components/sandboxes/section'
import { useSandboxAttention } from '@/hooks/queries/use-sandboxes'
import type { AttentionItem, AttentionKind } from '@/types/sandbox-delivery'

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
  today,
  hide,
  onSelect,
}: {
  sandboxId: string
  /** The sandbox's today, so each row can say how long it has been waiting. */
  today: string
  /**
   * Kinds something else on the same screen already says. The timeline sits
   * directly above this list and shows every open window, so repeating them
   * here is two rows for one fact. The cross-sandbox dashboard keeps them —
   * there is no timeline beside it.
   */
  hide?: AttentionKind[]
  onSelect: (item: AttentionItem) => void
}) {
  const { data, isLoading } = useSandboxAttention(sandboxId)
  const [expanded, setExpanded] = useState(false)
  const items = useMemo(
    () => (data ?? []).filter(i => !hide?.includes(i.kind)),
    [data, hide],
  )
  // A busy sandbox can run to thirty rows; the urgent ones sort first, so the
  // rest wait behind one click rather than burying the whole tab.
  const shown = expanded ? items : items.slice(0, FIRST)

  return (
    <Section
      id="attention"
      title="Needs you"
      sub={items.length > 0 ? items.length : undefined}
      testId="attention-panel"
      className="overflow-hidden"
      // The list brings its own rows and group bands; the section owns the
      // shell, so it hands over the whole body rather than padding it twice.
      bodyClassName="p-0"
      aside={
        items.length > FIRST && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-xs font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline"
            data-testid="attention-more"
          >
            {expanded ? 'Show fewer' : `Show all ${items.length}`}
          </button>
        )
      }
    >
      {isLoading ? (
        <Skeleton className="m-5 h-24 rounded-lg" />
      ) : (
        <NeedsAttentionList
          items={shown}
          showSandbox={false}
          today={today}
          className="rounded-none border-0 bg-transparent"
          onSelect={onSelect}
        />
      )}
    </Section>
  )
}
