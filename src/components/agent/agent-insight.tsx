'use client'

import {
  AlertCircle,
  ArrowUpRight,
  ChevronDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useState, type ComponentType } from 'react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChatMarkdown } from '@/components/ui/chat-markdown'
import { useAgentModal } from '@/components/agent/agent-modal'
import { useAgentInsight } from '@/hooks/queries/use-agent-insight'
import type { AgentApiScope } from '@/services/agent-service'
import { cn } from '@/lib/utils'

interface AgentInsightProps {
  /**
   * Fully-composed prompt (today's date + the relevant identifiers baked in).
   * Pass `null` to hold off generating until the upstream data is ready.
   */
  prompt: string | null
  scope: AgentApiScope
  /** Header label, e.g. "What needs attention today". */
  title: string
  /** Header icon. Defaults to Sparkles. */
  icon?: ComponentType<{ className?: string }>
  /** Gate generation explicitly (e.g. `enabled={!!client}`). Defaults to true. */
  enabled?: boolean
  /**
   * When set, shows an "open full" affordance that pops the agent modal
   * pre-seeded with this (usually deeper) prompt — depth on demand.
   */
  expandPrompt?: string
  /** Label for the expand affordance. Defaults to "Open full prep". */
  expandLabel?: string
  /** Show a chevron toggle that collapses the card body to just the header. */
  collapsible?: boolean
  /** When collapsible, start collapsed. Defaults to false (expanded). */
  defaultCollapsed?: boolean
  /**
   * Chromeless mode — render just an eyebrow label + the markdown (no Card
   * border, accent icon chip, or footer), so it can be embedded inside another
   * card (e.g. the "Your prep" slot of the next-session hero).
   */
  bare?: boolean
  className?: string
}

/**
 * A small, passive insight card: it fires one stateless prompt at the agent brain
 * and renders the synthesized markdown. No chat, no thread. Cheap to drop anywhere —
 * pass a `prompt` and a `title`. Failures degrade to an inline retry, never a thrown
 * error or a broken page.
 */
export function AgentInsight({
  prompt,
  scope,
  title,
  icon: Icon = Sparkles,
  enabled = true,
  expandPrompt,
  expandLabel = 'Open full prep',
  collapsible = false,
  defaultCollapsed = false,
  bare = false,
  className,
}: AgentInsightProps) {
  const active = !!prompt && enabled
  const [collapsed, setCollapsed] = useState(collapsible && defaultCollapsed)
  const { openAgent } = useAgentModal()
  const { data, isError, isFetching, regenerate } = useAgentInsight(
    prompt,
    scope,
    { enabled: enabled && !collapsed },
  )

  if (bare) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
            {title}
          </span>
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-ink-3">
            ✦ AI
          </span>
          <button
            type="button"
            onClick={() => regenerate()}
            disabled={!active || isFetching}
            aria-label="Regenerate insight"
            title="Regenerate"
            className="ml-auto shrink-0 rounded-md p-1 text-ink-3 transition hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw
              className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')}
            />
          </button>
        </div>
        {isError ? (
          <div className="flex items-start gap-2 text-sm text-ink-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-token" />
            <div>
              <p>Couldn&rsquo;t prepare this right now.</p>
              <button
                type="button"
                onClick={() => regenerate()}
                className="mt-1 font-medium text-ds-accent hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : data ? (
          <ChatMarkdown content={data.markdown} />
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-3 w-[92%]" />
            <Skeleton className="h-3 w-[80%]" />
            <Skeleton className="h-3 w-[86%]" />
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={cn('gap-0 overflow-hidden border-line p-0', className)}>
      <div
        className={cn(
          'flex items-center gap-2.5 px-4 py-3',
          !collapsed && 'border-b border-line',
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ds-accent-bg text-ds-accent">
          <Icon className="h-4 w-4" />
        </span>
        {collapsible ? (
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            aria-expanded={!collapsed}
            className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
              {title}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-ink-3 transition-transform',
                collapsed && '-rotate-90',
              )}
            />
          </button>
        ) : (
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
            {title}
          </p>
        )}
        <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-3">
          ✦ AI
        </span>
        {!collapsed && (
          <button
            type="button"
            onClick={() => regenerate()}
            disabled={!active || isFetching}
            aria-label="Regenerate insight"
            title="Regenerate"
            className="shrink-0 rounded-md p-1.5 text-ink-3 transition hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw
              className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')}
            />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 py-3.5">
          {isError ? (
            <div className="flex items-start gap-2 text-sm text-ink-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-token" />
              <div>
                <p>Couldn&rsquo;t generate this insight right now.</p>
                <button
                  type="button"
                  onClick={() => regenerate()}
                  className="mt-1 font-medium text-ds-accent hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : data ? (
            <>
              <ChatMarkdown content={data.markdown} />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[11px] text-ink-3">
                  Generated from your data
                  {isFetching ? ' · refreshing…' : ''}
                </p>
                {expandPrompt && (
                  <button
                    type="button"
                    onClick={() => openAgent({ scope, query: expandPrompt })}
                    className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-ds-accent hover:underline"
                  >
                    {expandLabel}
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-3 w-[92%]" />
              <Skeleton className="h-3 w-[80%]" />
              <Skeleton className="h-3 w-[86%]" />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
