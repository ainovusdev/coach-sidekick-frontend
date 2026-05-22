'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Share2, X, Users, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  useCoachSearch,
  useSessionShares,
} from '@/hooks/queries/use-session-shares'
import {
  useRevokeShare,
  useShareSession,
  useToggleShareWithAll,
} from '@/hooks/mutations/use-session-share-mutations'

interface ShareSessionDialogProps {
  sessionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RECENT_KEY = 'video-share-recent-coaches'
const RECENT_LIMIT = 5

interface RecentEntry {
  id: string
  full_name: string | null
  email: string
}

function loadRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, RECENT_LIMIT)
  } catch {
    return []
  }
}

function saveRecent(entries: RecentEntry[]) {
  try {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(entries.slice(0, RECENT_LIMIT)),
    )
  } catch {
    /* ignore */
  }
}

function useDebounced<T>(value: T, delay = 200): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export function ShareSessionDialog({
  sessionId,
  open,
  onOpenChange,
}: ShareSessionDialogProps) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search, 200)
  const [recent, setRecent] = useState<RecentEntry[]>([])

  const sharesQuery = useSessionShares(sessionId, { enabled: open })
  const searchQuery = useCoachSearch(debouncedSearch.trim(), open)
  const shareMut = useShareSession(sessionId)
  const revokeMut = useRevokeShare(sessionId)
  const toggleAllMut = useToggleShareWithAll(sessionId)

  useEffect(() => {
    if (open) setRecent(loadRecent())
  }, [open])

  const sharedUserIds = useMemo(() => {
    const set = new Set<string>()
    sharesQuery.data?.shares.forEach(s => set.add(s.shared_with_user_id))
    return set
  }, [sharesQuery.data])

  const visibleResults = useMemo(() => {
    const candidates = searchQuery.data ?? []
    return candidates.filter(c => !sharedUserIds.has(c.id))
  }, [searchQuery.data, sharedUserIds])

  const recentVisible = useMemo(
    () => recent.filter(r => !sharedUserIds.has(r.id)),
    [recent, sharedUserIds],
  )

  const handleAdd = async (entry: RecentEntry) => {
    await shareMut.mutateAsync([entry.id])
    const next = [entry, ...recent.filter(r => r.id !== entry.id)].slice(
      0,
      RECENT_LIMIT,
    )
    setRecent(next)
    saveRecent(next)
    setSearch('')
  }

  const handleRevoke = async (shareId: string) => {
    await revokeMut.mutateAsync(shareId)
  }

  const handleToggleAll = async (next: boolean) => {
    await toggleAllMut.mutateAsync(next)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-5 w-5 text-indigo" />
            Share session
          </DialogTitle>
          <DialogDescription>
            Share this recording with another coach so they can review and leave
            feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-3">
              Add coaches
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-4" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Type a name or email…"
                className="pl-8"
              />
              {searchQuery.isFetching && search && (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-ink-4" />
              )}
            </div>

            {search.trim() && visibleResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-line">
                {visibleResults.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() =>
                      handleAdd({
                        id: u.id,
                        full_name: u.full_name,
                        email: u.email,
                      })
                    }
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-paper"
                  >
                    <Initial label={u.full_name || u.email} />
                    <span className="flex-1">
                      <span className="block text-ink">
                        {u.full_name || u.email}
                      </span>
                      {u.full_name && (
                        <span className="block text-xs text-ink-3">
                          {u.email}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {search.trim() &&
              !searchQuery.isFetching &&
              visibleResults.length === 0 && (
                <p className="mt-2 text-xs text-ink-3">No matches.</p>
              )}

            {!search.trim() && recentVisible.length > 0 && (
              <div className="mt-2">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-4">
                  Recently shared with
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recentVisible.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleAdd(r)}
                      className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-2 hover:border-indigo hover:bg-indigo-bg hover:text-indigo"
                    >
                      {r.full_name || r.email}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-3">
              Shared with
            </label>
            {sharesQuery.isLoading ? (
              <div className="space-y-2">
                {[0, 1].map(i => (
                  <div
                    key={i}
                    className="h-7 animate-pulse rounded bg-surface-3"
                  />
                ))}
              </div>
            ) : sharesQuery.data && sharesQuery.data.shares.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {sharesQuery.data.shares.map(s => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-indigo-bg px-2.5 py-1 text-xs text-indigo ring-1 ring-indigo"
                  >
                    {s.shared_with_name || s.shared_with_email}
                    <button
                      type="button"
                      onClick={() => handleRevoke(s.id)}
                      disabled={revokeMut.isPending}
                      className="rounded-full p-0.5 text-indigo hover:bg-indigo-bg hover:text-indigo"
                      aria-label={`Remove ${s.shared_with_name || s.shared_with_email}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-3">Not shared with anyone yet.</p>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-md border border-line bg-paper p-3">
            <Users className="mt-0.5 h-4 w-4 text-ink-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">
                Share with all coaches
              </p>
              <p className="text-xs text-ink-3">
                Anyone in your team with a coach role will be able to view and
                comment.
              </p>
            </div>
            <Switch
              checked={!!sharesQuery.data?.is_shared_with_all_coaches}
              onCheckedChange={handleToggleAll}
              disabled={toggleAllMut.isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Initial({ label }: { label: string }) {
  const initial = (label || '?').trim().charAt(0).toUpperCase()
  return (
    <span
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-bg text-[11px] font-medium text-indigo',
      )}
    >
      {initial}
    </span>
  )
}
