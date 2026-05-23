'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useAgentThreads } from '@/hooks/queries/use-agent-threads'
import { useDeleteAgentThread } from '@/hooks/mutations/use-agent-thread-mutations'
import { cn } from '@/lib/utils'
import type { AgentThreadSummary } from '@/types/agent'

interface AgentThreadSidebarProps {
  /** Currently-open thread id (from URL), or null on a fresh /admin/agent visit. */
  activeThreadId: string | null
  /** Open a thread — parent pushes ?thread=<id> to the URL. */
  onSelectThread: (threadId: string) => void
  /** Clear chat state and URL. */
  onNewThread: () => void
}

const COLLAPSED_KEY = 'admin-agent-sidebar-collapsed'

function loadCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(COLLAPSED_KEY) === '1'
}

function persistCollapsed(collapsed: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0')
}

export function AgentThreadSidebar({
  activeThreadId,
  onSelectThread,
  onNewThread,
}: AgentThreadSidebarProps) {
  const [collapsed, setCollapsed] = useState<boolean>(loadCollapsed)
  const [confirmDelete, setConfirmDelete] = useState<AgentThreadSummary | null>(
    null,
  )

  const { data, isLoading } = useAgentThreads()
  const threads = data?.threads ?? []
  const deleteMutation = useDeleteAgentThread()

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    persistCollapsed(next)
  }

  if (collapsed) {
    return (
      <div className="flex w-12 flex-col items-center gap-2 border-r border-line bg-surface-1 py-3">
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleCollapsed}
          aria-label="Expand thread list"
          title="Expand thread list"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onNewThread}
          aria-label="New conversation"
          title="New conversation"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex w-64 flex-shrink-0 flex-col border-r border-line bg-surface-1">
        <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
          <Button
            size="sm"
            variant="default"
            onClick={onNewThread}
            className="flex-1 justify-start gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            New chat
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleCollapsed}
            aria-label="Collapse thread list"
            title="Collapse"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {isLoading ? (
            <div className="px-3 py-2 text-xs text-ink-3">Loading…</div>
          ) : threads.length === 0 ? (
            <div className="px-3 py-4 text-xs text-ink-3">
              Your saved conversations will appear here.
            </div>
          ) : (
            <ul className="flex flex-col">
              {threads.map(t => (
                <ThreadRow
                  key={t.id}
                  thread={t}
                  active={t.id === activeThreadId}
                  onClick={() => onSelectThread(t.id)}
                  onDelete={() => setConfirmDelete(t)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={!!confirmDelete}
        onOpenChange={open => {
          if (!open) setConfirmDelete(null)
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

interface ThreadRowProps {
  thread: AgentThreadSummary
  active: boolean
  onClick: () => void
  onDelete: () => void
}

function ThreadRow({ thread, active, onClick, onDelete }: ThreadRowProps) {
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-xs transition',
          active
            ? 'bg-ds-accent-bg text-ink'
            : 'text-ink-2 hover:bg-ds-accent-bg/60 hover:text-ink',
        )}
      >
        <span className="line-clamp-1 w-full pr-7 font-medium">
          {thread.title}
        </span>
        <span className="text-[10px] text-ink-3">
          {formatRelative(thread.last_message_at)}
        </span>
      </button>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          onDelete()
        }}
        aria-label={`Delete ${thread.title}`}
        title="Delete conversation"
        className="absolute right-1.5 top-1.5 hidden rounded p-1 text-ink-3 hover:bg-paper hover:text-vermillion group-hover:block"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

/**
 * Compact relative time: "just now" / "5m ago" / "2h ago" / "yesterday" /
 * "3d ago" / a date. Calculated client-side — no need for a library.
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
