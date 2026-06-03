'use client'

import { useEffect } from 'react'
import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAgentModal } from '@/components/agent/agent-modal'
import type { AgentApiScope } from '@/services/agent-service'

interface AskSidekickBarProps {
  /** Agent data scope to open the modal in. Defaults to coach. */
  scope?: AgentApiScope
  className?: string
  placeholder?: string
}

/**
 * Header launcher: a search-field-styled button that opens the Sidekick Agent as
 * a large on-page modal — composer focused, starter chips showing, ready to type.
 * You keep your place (no navigation). Also bound to ⌘K / Ctrl+K. Used in the coach
 * top nav; hidden below `md` (small screens use the dashboard card instead).
 */
export function AskSidekickBar({
  scope = 'coach',
  className,
  placeholder = 'Ask Sidekick…',
}: AskSidekickBarProps) {
  const { openAgent, isOpen } = useAgentModal()

  // ⌘K / Ctrl+K opens the agent from anywhere this bar is mounted (coach pages).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (!isOpen) openAgent({ scope })
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openAgent, isOpen, scope])

  return (
    <button
      type="button"
      onClick={() => openAgent({ scope })}
      aria-label="Ask Sidekick"
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        'hidden h-9 w-56 items-center gap-2 rounded-lg border border-line bg-surface-2 pl-2.5 pr-2 text-[13px] text-ink-3 transition-colors hover:border-line-strong hover:bg-surface-1 hover:text-ink focus:outline-none focus:ring-2 focus:ring-ds-accent/30 md:flex lg:w-64',
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-ds-accent" />
      <span className="flex-1 truncate text-left">{placeholder}</span>
      <kbd className="hidden shrink-0 rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink-3 lg:inline-block">
        ⌘K
      </kbd>
    </button>
  )
}
