'use client'

import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useAgentThreads } from '@/hooks/queries/use-agent-threads'
import { useDeleteAgentThread } from '@/hooks/mutations/use-agent-thread-mutations'
import { cn } from '@/lib/utils'
import type { AgentApiScope } from '@/services/agent-service'
import type { AgentThreadSummary } from '@/types/agent'

interface AgentThreadSidebarProps {
  /** Which agent mount this sidebar lists threads for. */
  apiScope: AgentApiScope
  /** Currently-open thread id (from URL), or null on a fresh visit. */
  activeThreadId: string | null
  /** Open a thread — parent pushes ?thread=<id> to the URL. */
  onSelectThread: (threadId: string) => void
  /** Clear chat state and URL. */
  onNewThread: () => void
}

function loadCollapsed(scope: AgentApiScope): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(`${scope}-agent-sidebar-collapsed`) === '1'
}

function persistCollapsed(scope: AgentApiScope, collapsed: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    `${scope}-agent-sidebar-collapsed`,
    collapsed ? '1' : '0',
  )
}

export function AgentThreadSidebar({
  apiScope,
  activeThreadId,
  onSelectThread,
  onNewThread,
}: AgentThreadSidebarProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() =>
    loadCollapsed(apiScope),
  )
  const [query, setQuery] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<AgentThreadSummary | null>(
    null,
  )

  const { data, isLoading } = useAgentThreads(apiScope)
  const deleteMutation = useDeleteAgentThread(apiScope)

  // Filter by title, then bucket by recency (Today / This week / Earlier).
  const groups = useMemo(
    () => groupThreads(data?.threads ?? [], query),
    [data, query],
  )
  const hasAny = groups.some(g => g.threads.length > 0)

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    persistCollapsed(apiScope, next)
  }

  if (collapsed) {
    return (
      <div className="flex w-12 flex-col items-center gap-2 border-r border-line bg-surface-1 py-3">
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleCollapsed}
          aria-label="Expand conversation list"
          title="Expand conversations"
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
      <div className="flex w-72 flex-shrink-0 flex-col border-r border-line bg-surface-1">
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onNewThread}
              className="flex-1 justify-center gap-2 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              New conversation
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleCollapsed}
              aria-label="Collapse conversation list"
              title="Collapse"
              className="shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
              className="h-9 w-full rounded-lg border border-line bg-paper pl-8 pr-3 text-[13px] text-ink placeholder:text-ink-3 focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ds-accent/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {isLoading ? (
            <div className="px-2 py-2 text-xs text-ink-3">Loading…</div>
          ) : !hasAny ? (
            <div className="px-2 py-4 text-xs text-ink-3">
              {query
                ? 'No conversations match your search.'
                : 'Your saved conversations will appear here.'}
            </div>
          ) : (
            groups.map(group =>
              group.threads.length === 0 ? null : (
                <div key={group.label} className="mb-1">
                  <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                    {group.label}
                  </p>
                  <ul className="flex flex-col">
                    {group.threads.map(t => (
                      <ThreadRow
                        key={t.id}
                        thread={t}
                        active={t.id === activeThreadId}
                        onClick={() => onSelectThread(t.id)}
                        onDelete={() => setConfirmDelete(t)}
                      />
                    ))}
                  </ul>
                </div>
              ),
            )
          )}
        </div>

        <div className="flex items-center gap-1.5 border-t border-line px-3 py-2.5 text-[11px] text-ink-3">
          <Lock className="h-3 w-3 shrink-0" />
          <span>Private · saved automatically</span>
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
    <li className="group relative px-1">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex w-full flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-left transition',
          active ? 'bg-ds-accent-bg' : 'hover:bg-ds-accent-bg/50',
        )}
      >
        <span
          className={cn(
            'line-clamp-1 w-full pr-6 text-[13px] font-medium',
            active ? 'text-ink' : 'text-ink-2 group-hover:text-ink',
          )}
        >
          {thread.title}
        </span>
        <span className="text-[11px] text-ink-3">
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
        className="absolute right-2 top-2 hidden rounded p-1 text-ink-3 hover:bg-paper hover:text-vermillion group-hover:block"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

interface ThreadGroup {
  label: string
  threads: AgentThreadSummary[]
}

/**
 * Filter by title (case-insensitive), then bucket into Today / This week /
 * Earlier by `last_message_at`. Input order (newest-first) is preserved within
 * each bucket. Empty buckets are dropped by the caller.
 */
function groupThreads(
  threads: AgentThreadSummary[],
  query: string,
): ThreadGroup[] {
  const q = query.trim().toLowerCase()
  const filtered = q
    ? threads.filter(t => t.title.toLowerCase().includes(q))
    : threads

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayMs = startOfToday.getTime()
  const weekAgoMs = todayMs - 6 * 86_400_000 // last 7 days, today inclusive

  const today: AgentThreadSummary[] = []
  const week: AgentThreadSummary[] = []
  const earlier: AgentThreadSummary[] = []
  for (const t of filtered) {
    const ts = new Date(t.last_message_at).getTime()
    if (Number.isNaN(ts) || ts >= todayMs) today.push(t)
    else if (ts >= weekAgoMs) week.push(t)
    else earlier.push(t)
  }

  return [
    { label: 'Today', threads: today },
    { label: 'This week', threads: week },
    { label: 'Earlier', threads: earlier },
  ]
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
