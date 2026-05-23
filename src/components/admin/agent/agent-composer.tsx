'use client'

import { useRef, KeyboardEvent } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Send, Square } from 'lucide-react'

interface Props {
  value: string
  onChange: (next: string) => void
  onSend: () => void
  onCancel: () => void
  streaming: boolean
  disabled?: boolean
}

export function AgentComposer({
  value,
  onChange,
  onSend,
  onCancel,
  streaming,
  disabled,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter to send.
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!streaming && value.trim()) onSend()
    }
  }

  return (
    <div className="border-t border-line bg-paper px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-end gap-2">
        <Textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about coaches, clients, sessions, scores…"
          rows={2}
          className="min-h-[60px] resize-none"
          disabled={disabled}
        />
        {streaming ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancel}
            className="gap-2"
          >
            <Square className="h-4 w-4" />
            Stop
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        )}
      </div>
      <p className="mx-auto mt-1.5 max-w-4xl text-[11px] text-ink-3">
        Press <kbd className="rounded border border-line px-1">⌘</kbd>+
        <kbd className="rounded border border-line px-1">Enter</kbd> to send.
      </p>
    </div>
  )
}
