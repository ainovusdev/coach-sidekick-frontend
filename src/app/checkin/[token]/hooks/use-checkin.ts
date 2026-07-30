'use client'

/**
 * All state for the public check-in page.
 *
 * Deliberately NOT TanStack Query: one request, one consumer, no navigation and
 * no cache sharing, while the global queryClient's `refetchOnWindowFocus` +
 * 5-minute `staleTime` actively fight this page (backgrounding a phone
 * mid-interaction would refetch and wipe optimistic + undo state). Overriding
 * those to neutralise the library is a sign the library isn't wanted here.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  CheckinApiError,
  CheckinCommitment,
  CheckinPage,
  CheckinService,
} from '@/services/checkin-service'
import { spokenDate } from '../utils/checkin-view'

export type CheckinStatus = 'loading' | 'ready' | 'expired' | 'failed'

export interface RowError {
  message: string
  retry: () => void
}

function messageForKind(err: unknown): string {
  const kind = err instanceof CheckinApiError ? err.kind : 'server'
  if (kind === 'network') return "You're offline."
  if (kind === 'conflict') return 'Already updated somewhere else.'
  return "Didn't save."
}

export function useCheckin(token: string) {
  const [status, setStatus] = useState<CheckinStatus>('loading')
  const [data, setData] = useState<CheckinPage | null>(null)
  const [items, setItems] = useState<CheckinCommitment[]>([])
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [rowErrors, setRowErrors] = useState<Record<string, RowError>>({})
  const [attempts, setAttempts] = useState(0)

  // Two regions, not one: politeness is a property of the element, so a failure
  // can't be announced assertively through a polite node.
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')

  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const setPending = useCallback((id: string, on: boolean) => {
    setPendingIds(prev => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const clearRowError = useCallback((id: string) => {
    setRowErrors(prev => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const page = await CheckinService.getCheckin(token)
      if (!mounted.current) return
      setData(page)
      setItems(page.commitments)
      setRowErrors({})
      setStatus('ready')
    } catch (err) {
      if (!mounted.current) return
      setAttempts(a => a + 1)
      // Only a GET 404 means the token is genuinely dead.
      setStatus(
        err instanceof CheckinApiError && err.kind === 'expired'
          ? 'expired'
          : 'failed',
      )
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  /** Pull fresh server state without tearing the page down (used after a 409). */
  const refresh = useCallback(async () => {
    try {
      const page = await CheckinService.getCheckin(token)
      if (!mounted.current) return
      setData(page)
      setItems(page.commitments)
    } catch {
      // A refresh is best-effort; the row-level error already told the story.
    }
  }, [token])

  const toggle = useCallback(
    async (item: CheckinCommitment, forced?: boolean) => {
      if (pendingIds.has(item.id)) return
      const next = forced ?? !item.completed

      clearRowError(item.id)
      setItems(prev =>
        prev.map(i => (i.id === item.id ? { ...i, completed: next } : i)),
      )
      setPending(item.id, true)

      try {
        const res = await CheckinService.toggleCommitment(token, item.id, next)
        if (!mounted.current) return
        setItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? { ...i, status: res.status, completed: res.completed }
              : i,
          ),
        )
        if (next) {
          const remaining = items.filter(
            i => !i.completed && i.id !== item.id,
          ).length
          setPoliteMessage(
            `Marked "${item.title}" as done. ${remaining} still open.`,
          )
          toast.success('Nice — marked done', {
            duration: 8000,
            action: {
              label: 'Undo',
              onClick: () => void toggle({ ...item, completed: true }, false),
            },
          })
        } else {
          setPoliteMessage(`"${item.title}" is back on your list.`)
          toast.success('Back on your list')
        }
      } catch (err) {
        if (!mounted.current) return
        // Revert — a control that looks saved but isn't is worse than a visible
        // failure — but leave a persistent, row-anchored error behind. A toast
        // alone is what makes today's behaviour silent in practice: top-right,
        // on a scrolled mobile list, gone in five seconds.
        setItems(prev =>
          prev.map(i =>
            i.id === item.id ? { ...i, completed: item.completed } : i,
          ),
        )
        const message = messageForKind(err)
        setAssertiveMessage(`${message} "${item.title}"`)
        if (err instanceof CheckinApiError && err.kind === 'conflict') {
          // Retrying would just 409 again — resync instead of offering a retry.
          toast.error('Already updated somewhere else')
          void refresh()
        } else {
          setRowErrors(prev => ({
            ...prev,
            [item.id]: { message, retry: () => void toggle(item, next) },
          }))
        }
      } finally {
        if (mounted.current) setPending(item.id, false)
      }
    },
    [clearRowError, items, pendingIds, refresh, setPending, token],
  )

  const reschedule = useCallback(
    async (item: CheckinCommitment, targetDate: string | null) => {
      if (pendingIds.has(item.id)) return
      const previous = item.target_date ?? null

      clearRowError(item.id)
      setItems(prev =>
        prev.map(i =>
          i.id === item.id ? { ...i, target_date: targetDate } : i,
        ),
      )
      setPending(item.id, true)

      try {
        const res = await CheckinService.rescheduleCommitment(
          token,
          item.id,
          targetDate,
        )
        if (!mounted.current) return
        setItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? {
                  ...i,
                  target_date: res.target_date,
                  status: res.status,
                  completed: res.completed,
                }
              : i,
          ),
        )
        setPoliteMessage(
          targetDate
            ? `Moved "${item.title}" to ${spokenDate(targetDate)}.`
            : `Due date cleared for "${item.title}".`,
        )
      } catch (err) {
        if (!mounted.current) return
        setItems(prev =>
          prev.map(i =>
            i.id === item.id ? { ...i, target_date: previous } : i,
          ),
        )
        const message = messageForKind(err)
        setAssertiveMessage(`${message} "${item.title}"`)
        if (err instanceof CheckinApiError && err.kind === 'conflict') {
          toast.error('Already updated somewhere else')
          void refresh()
        } else {
          setRowErrors(prev => ({
            ...prev,
            [item.id]: {
              message,
              retry: () => void reschedule(item, targetDate),
            },
          }))
        }
      } finally {
        if (mounted.current) setPending(item.id, false)
      }
    },
    [clearRowError, pendingIds, refresh, setPending, token],
  )

  return {
    status,
    data,
    items,
    pendingIds,
    rowErrors,
    attempts,
    politeMessage,
    assertiveMessage,
    retryLoad: load,
    toggle,
    reschedule,
  }
}
