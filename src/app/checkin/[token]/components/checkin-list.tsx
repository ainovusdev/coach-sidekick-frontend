'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Check, PartyPopper } from 'lucide-react'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import {
  CheckinCommitment,
  CheckinPage,
  CheckinService,
} from '@/services/checkin-service'

interface CheckinListProps {
  token: string
  data: CheckinPage
}

function dueLabel(item: CheckinCommitment): string {
  if (!item.target_date) return ''
  const due = parseISO(item.target_date)
  const days = differenceInCalendarDays(new Date(), due)
  if (item.completed) return `Was due ${format(due, 'MMM d')}`
  if (days > 0) {
    return `Due ${format(due, 'MMM d')} · ${days} day${days === 1 ? '' : 's'} overdue`
  }
  if (days === 0) return 'Due today'
  return `Due ${format(due, 'EEE, MMM d')}`
}

export function CheckinList({ token, data }: CheckinListProps) {
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('commitment')

  const [items, setItems] = useState<CheckinCommitment[]>(data.commitments)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrolledRef = useRef(false)

  // Scroll the row the email's "Mark done" button pointed at into view once.
  useEffect(() => {
    if (!highlightId || scrolledRef.current) return
    const el = rowRefs.current[highlightId]
    if (el) {
      scrolledRef.current = true
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightId, items])

  const openCount = useMemo(
    () => items.filter(i => !i.completed).length,
    [items],
  )
  const overdueCount = useMemo(
    () =>
      items.filter(
        i =>
          !i.completed &&
          i.target_date &&
          differenceInCalendarDays(new Date(), parseISO(i.target_date)) > 0,
      ).length,
    [items],
  )

  const toggle = async (item: CheckinCommitment) => {
    if (pendingIds.has(item.id)) return
    const next = !item.completed

    // Optimistic flip; revert on failure.
    setItems(prev =>
      prev.map(i => (i.id === item.id ? { ...i, completed: next } : i)),
    )
    setPendingIds(prev => new Set(prev).add(item.id))
    try {
      const res = await CheckinService.toggleCommitment(token, item.id, next)
      setItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? { ...i, status: res.status, completed: res.completed }
            : i,
        ),
      )
      if (next) toast.success('Marked as done')
    } catch {
      setItems(prev =>
        prev.map(i =>
          i.id === item.id ? { ...i, completed: item.completed } : i,
        ),
      )
      toast.error('Could not update — please try again')
    } finally {
      setPendingIds(prev => {
        const nextSet = new Set(prev)
        nextSet.delete(item.id)
        return nextSet
      })
    }
  }

  const allDone = items.length > 0 && openCount === 0

  return (
    <div className="min-h-screen bg-surface-1 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {/* The logo asset is white-on-transparent — give it a dark chip
              (mirrors the email's black header band) */}
          <div className="inline-flex items-center justify-center bg-ink rounded-lg px-5 py-3 mb-6">
            <Image
              src="/novus-global-logo.webp"
              alt="Novus Global"
              width={110}
              height={36}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">
            {data.client_first_name}, here&apos;s your week
          </h1>
          {data.coach_name && (
            <p className="text-sm text-ink-3 mb-4">
              Coaching with {data.coach_name}
            </p>
          )}
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-paper border border-line text-ink-2">
              {openCount} open
            </span>
            {overdueCount > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-vermillion-bg border border-vermillion text-vermillion">
                {overdueCount} overdue
              </span>
            )}
            {allDone && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-forest-bg border border-forest text-forest">
                <PartyPopper className="h-3.5 w-3.5" />
                All caught up
              </span>
            )}
          </div>
        </div>

        {/* Commitment rows */}
        <div className="space-y-2">
          {items.map(item => {
            const isOverdue =
              !item.completed &&
              !!item.target_date &&
              differenceInCalendarDays(new Date(), parseISO(item.target_date)) >
                0
            const isHighlighted = highlightId === item.id
            const label = dueLabel(item)
            return (
              <div
                key={item.id}
                ref={el => {
                  rowRefs.current[item.id] = el
                }}
                className={`flex items-start gap-3 p-4 bg-paper rounded-lg border transition-colors ${
                  isHighlighted
                    ? 'border-ink ring-2 ring-ink/20'
                    : isOverdue
                      ? 'border-line border-l-2 border-l-vermillion'
                      : 'border-line'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  disabled={pendingIds.has(item.id)}
                  aria-label={
                    item.completed
                      ? `Mark "${item.title}" as not done`
                      : `Mark "${item.title}" as done`
                  }
                  className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 ${
                    item.completed
                      ? 'bg-forest border-forest text-white'
                      : 'border-line-strong hover:border-forest'
                  }`}
                >
                  {item.completed && <Check className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium leading-snug ${
                      item.completed ? 'text-ink-4 line-through' : 'text-ink'
                    }`}
                  >
                    {item.title}
                  </p>
                  {label && (
                    <p
                      className={`text-xs mt-1 ${
                        isOverdue ? 'text-vermillion' : 'text-ink-3'
                      }`}
                    >
                      {label}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12 bg-paper rounded-lg border border-line">
            <p className="text-sm text-ink-3">
              Nothing open right now. Enjoy the week!
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-ink-4 mt-10">
          Tap the circle to mark a commitment done — changes save instantly.
        </p>
        <p className="text-center text-xs text-ink-4 mt-2">
          Powered by Novus Global
        </p>
      </div>
    </div>
  )
}
