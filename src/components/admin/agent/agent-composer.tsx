'use client'

import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowUp, Paperclip, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentApiScope } from '@/services/agent-service'
import { AgentAttachmentChip } from './agent-attachment-chip'
import {
  ATTACHMENT_ACCEPT,
  type PendingAttachment,
} from './use-agent-attachments'

/** Wiring for the attachment tray. Omit to hide attachments entirely. */
export interface ComposerAttachments {
  items: PendingAttachment[]
  busy: boolean
  failed: boolean
  readyCount: number
  onAddFiles: (files: File[]) => void
  onRemove: (localId: string) => void
  onRetry: (localId: string) => void
}

interface Props {
  value: string
  onChange: (next: string) => void
  /** `text` overrides the textarea (suggestion pills). */
  onSend: (text?: string) => void
  onCancel: () => void
  streaming: boolean
  disabled?: boolean
  /** Focus the textarea on mount (used when the agent opens in a modal). */
  autoFocus?: boolean
  /** Drives the placeholder + the reassurance line under the input. */
  apiScope?: AgentApiScope
  attachments?: ComposerAttachments
  /** Bumped by the parent to pull focus back to the textarea (after a file pick). */
  focusSignal?: number
}

const PLACEHOLDER: Record<AgentApiScope, string> = {
  admin: 'Ask anything about coaches, clients, sessions, or scores…',
  coach: 'Ask anything about your clients, sessions, or transcripts…',
  client: 'Ask anything about your sessions, plan, or progress…',
}

const DISCLAIMER: Record<AgentApiScope, string> = {
  admin:
    'Sidekick can make mistakes — it has read-only access to your data and files you attach.',
  coach:
    'Sidekick can make mistakes — it reads only your coaching data and files you attach.',
  client: 'Sidekick can make mistakes — it reads only your coaching data.',
}

const FILE_SUGGESTIONS = [
  'Summarize this',
  'Pull out action items',
  'What should I ask about this?',
]

export function AgentComposer({
  value,
  onChange,
  onSend,
  onCancel,
  streaming,
  disabled,
  autoFocus,
  apiScope = 'admin',
  attachments,
  focusSignal,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Focus on mount in modal mode — the user opened the agent to talk to it.
  // (Done via effect rather than the DOM autofocus attr so it plays nicely with
  // the dialog's own focus management.)
  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (focusSignal) ref.current?.focus()
  }, [focusSignal])

  // Auto-grow the textarea up to a few lines, then scroll.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const items = attachments?.items ?? []
  const hasChips = items.length > 0
  const readyCount = attachments?.readyCount ?? 0
  const filesBusy = attachments?.busy ?? false
  const filesFailed = attachments?.failed ?? false
  const hasText = value.trim().length > 0
  // A file on its own is a valid message (the agent summarises it).
  const canSend =
    !streaming &&
    !disabled &&
    !filesBusy &&
    !filesFailed &&
    (hasText || readyCount > 0)

  const blockedHint = filesFailed
    ? 'Remove or retry the file that couldn’t be attached to send.'
    : filesBusy && (hasText || readyCount > 0)
      ? 'Waiting for your file to finish reading…'
      : null

  const placeholder =
    readyCount > 0 && !hasText
      ? 'Ask about this file, or press Enter for a summary'
      : PLACEHOLDER[apiScope]

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSend) onSend()
      return
    }
    // Backspace in an empty box removes the last file chip.
    if (e.key === 'Backspace' && !value && hasChips && attachments) {
      e.preventDefault()
      attachments.onRemove(items[items.length - 1].localId)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!attachments) return
    const files = Array.from(e.clipboardData?.files ?? [])
    if (files.length === 0) return // plain text paste — leave it alone
    e.preventDefault()
    attachments.onAddFiles(files)
  }

  const showSuggestions = readyCount > 0 && !hasText && !streaming

  return (
    <div className="border-t border-line bg-paper px-4 py-3">
      {showSuggestions ? (
        <div className="mx-auto mb-2 flex max-w-3xl flex-wrap gap-1.5">
          {FILE_SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onSend(s)}
              disabled={!canSend}
              className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-ink-2 transition hover:border-line-strong hover:bg-ds-accent-bg hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent/40"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
      <div
        className={cn(
          'mx-auto flex max-w-3xl flex-col border border-line bg-paper shadow-sm transition',
          hasChips
            ? 'rounded-2xl px-2.5 pb-2 pt-2.5'
            : 'rounded-[1.75rem] px-2 py-1.5',
          'focus-within:border-line-strong focus-within:shadow-md focus-within:ring-2 focus-within:ring-ds-accent/20',
        )}
      >
        {hasChips && attachments ? (
          <div
            className="mb-1.5 flex flex-wrap gap-1.5"
            aria-label="Attached files"
          >
            {items.map(item => (
              <AgentAttachmentChip
                key={item.localId}
                item={item}
                onRemove={attachments.onRemove}
                onRetry={attachments.onRetry}
              />
            ))}
          </div>
        ) : null}
        <div className="flex items-end gap-1.5">
          {attachments ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ATTACHMENT_ACCEPT}
                className="hidden"
                tabIndex={-1}
                aria-hidden
                onChange={e => {
                  const files = Array.from(e.target.files ?? [])
                  e.target.value = '' // allow picking the same file again
                  attachments.onAddFiles(files)
                }}
              />
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled || streaming}
                      aria-label="Attach files"
                      className="h-9 w-9 shrink-0 rounded-full text-ink-3 hover:text-ink"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    Attach PDF, Word, text or CSV (up to 25 MB)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : (
            <span className="w-2 shrink-0" />
          )}
          <Textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
            className="max-h-40 min-h-[24px] flex-1 resize-none border-0 bg-transparent px-0 py-2 dark:bg-transparent text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
              onClick={() => onSend()}
              disabled={!canSend}
              aria-label="Send"
              title={blockedHint ?? 'Send'}
              className="h-9 w-9 shrink-0 rounded-full"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="mx-auto mt-2 flex max-w-3xl items-center justify-between gap-3 px-1 text-[11px] text-ink-3">
        <span className={cn(blockedHint ? 'text-ink-2' : 'truncate')}>
          {blockedHint ?? DISCLAIMER[apiScope]}
        </span>
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
