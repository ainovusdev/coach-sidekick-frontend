'use client'

import { useEffect, useRef, KeyboardEvent } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowUp, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentApiScope } from '@/services/agent-service'

interface Props {
  value: string
  onChange: (next: string) => void
  onSend: () => void
  onCancel: () => void
  streaming: boolean
  disabled?: boolean
  /** Focus the textarea on mount (used when the agent opens in a modal). */
  autoFocus?: boolean
  /** Drives the placeholder + the reassurance line under the input. */
  apiScope?: AgentApiScope
}

const PLACEHOLDER: Record<AgentApiScope, string> = {
  admin: 'Ask anything about coaches, clients, sessions, or scores…',
  coach: 'Ask anything about your clients, sessions, or transcripts…',
  client: 'Ask anything about your sessions, plan, or progress…',
}

const DISCLAIMER: Record<AgentApiScope, string> = {
  admin: 'Sidekick can make mistakes — it has read-only access to your data.',
  coach: 'Sidekick can make mistakes — it reads only your coaching data.',
  client: 'Sidekick can make mistakes — it reads only your coaching data.',
}

export function AgentComposer({
  value,
  onChange,
  onSend,
  onCancel,
  streaming,
  disabled,
  autoFocus,
  apiScope = 'admin',
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Focus on mount in modal mode — the user opened the agent to talk to it.
  // (Done via effect rather than the DOM autofocus attr so it plays nicely with
  // the dialog's own focus management.)
  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  // Auto-grow the textarea up to a few lines, then scroll.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!streaming && value.trim()) onSend()
    }
  }

  return (
    <div className="border-t border-line bg-paper px-4 py-3">
      <div
        className={cn(
          'mx-auto flex max-w-3xl items-end gap-2 rounded-[1.75rem] border border-line bg-paper px-4 py-2.5 shadow-sm transition',
          'focus-within:border-line-strong focus-within:shadow-md focus-within:ring-2 focus-within:ring-ds-accent/20',
        )}
      >
        <Textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDER[apiScope]}
          rows={1}
          disabled={disabled}
          className="max-h-40 min-h-[24px] flex-1 resize-none border-0 bg-transparent px-0 py-1.5 text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {streaming ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onCancel}
            aria-label="Stop"
            title="Stop"
            className="h-9 w-9 shrink-0 rounded-full"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={onSend}
            disabled={disabled || !value.trim()}
            aria-label="Send"
            title="Send"
            className="h-9 w-9 shrink-0 rounded-full"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="mx-auto mt-2 flex max-w-3xl items-center justify-between gap-3 px-1 text-[11px] text-ink-3">
        <span className="truncate">{DISCLAIMER[apiScope]}</span>
        <span className="hidden shrink-0 sm:inline">
          <kbd className="rounded border border-line bg-surface-1 px-1 font-sans">
            Enter
          </kbd>{' '}
          to send
        </span>
      </div>
    </div>
  )
}
