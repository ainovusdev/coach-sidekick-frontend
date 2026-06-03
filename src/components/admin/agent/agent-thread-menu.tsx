'use client'

import { useState } from 'react'
import { History, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useAgentThreads } from '@/hooks/queries/use-agent-threads'
import { useDeleteAgentThread } from '@/hooks/mutations/use-agent-thread-mutations'
import { cn } from '@/lib/utils'
import type { AgentApiScope } from '@/services/agent-service'
import type { AgentThreadSummary } from '@/types/agent'

/**
 * Compact "History" popover for the embedded agent (the dashboard column is too
 * narrow for the full 256px sidebar). Lists saved conversations, lets the user
 * switch / start-new / delete — mirroring AgentThreadSidebar but in a popover.
 *
 * Lazy: the thread list is only fetched while the popover is open, so dropping
 * the embedded agent onto a dashboard doesn't add a request to its initial load.
 */
interface AgentThreadMenuProps {
  apiScope: AgentApiScope
  activeThreadId: string | null
  onSelectThread: (threadId: string) => void
  onNewThread: () => void
}

export function AgentThreadMenu({
  apiScope,
  activeThreadId,
  onSelectThread,
  onNewThread,
}: AgentThreadMenuProps) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<AgentThreadSummary | null>(
    null,
  )

  const { data, isLoading } = useAgentThreads(apiScope, { enabled: open })
  const threads = data?.threads ?? []
  const deleteMutation = useDeleteAgentThread(apiScope)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Conversation history"
            title="History"
          >
            <History className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-0">
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
            <span className="text-xs font-semibold text-ink">
              Conversations
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 px-2 text-xs"
              onClick={() => {
                onNewThread()
                setOpen(false)
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {isLoading ? (
              <div className="px-3 py-3 text-xs text-ink-3">Loading…</div>
            ) : threads.length === 0 ? (
              <div className="px-3 py-4 text-xs text-ink-3">
                Your saved conversations will appear here.
              </div>
            ) : (
              <ul className="flex flex-col">
                {threads.map(t => (
                  <li key={t.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectThread(t.id)
                        setOpen(false)
                      }}
                      className={cn(
                        'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-xs transition',
                        t.id === activeThreadId
                          ? 'bg-ds-accent-bg text-ink'
                          : 'text-ink-2 hover:bg-ds-accent-bg/60 hover:text-ink',
                      )}
                    >
                      <span className="line-clamp-1 w-full pr-7 font-medium">
                        {t.title}
                      </span>
                      <span className="text-[10px] text-ink-3">
                        {formatRelative(t.last_message_at)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        setConfirmDelete(t)
                      }}
                      aria-label={`Delete ${t.title}`}
                      title="Delete conversation"
                      className="absolute right-1.5 top-1.5 hidden rounded p-1 text-ink-3 hover:bg-paper hover:text-vermillion group-hover:block"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <ConfirmationDialog
        open={!!confirmDelete}
        onOpenChange={o => {
          if (!o) setConfirmDelete(null)
        }}
        title="Delete this conversation?"
        description={
          confirmDelete
            ? `"${confirmDelete.title}" will be permanently removed. This can't be undone.`
            : ''
        }
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!confirmDelete) return
          deleteMutation.mutate(confirmDelete.id)
          setConfirmDelete(null)
        }}
      />
    </>
  )
}

/**
 * Compact relative time: "just now" / "5m ago" / "2h ago" / "yesterday" /
 * "3d ago" / a date. (Same formatting the sidebar uses.)
 */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = Date.now() - then
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
