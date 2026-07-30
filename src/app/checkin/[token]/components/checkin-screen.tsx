'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { CheckCircle2 } from 'lucide-react'
import type { CheckinPage } from '@/services/checkin-service'
import type { useCheckin } from '../hooks/use-checkin'
import { bucketOf, groupCommitments } from '../utils/checkin-view'
import { CheckinRow } from './checkin-row'
import { CheckinSection } from './checkin-section'
import { EmptyState } from './checkin-states'

interface CheckinScreenProps {
  data: CheckinPage
  checkin: ReturnType<typeof useCheckin>
}

export function CheckinScreen({ data, checkin }: CheckinScreenProps) {
  const { items, pendingIds, rowErrors, politeMessage, assertiveMessage } =
    checkin
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('commitment')

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrolledRef = useRef(false)
  const [pulseId, setPulseId] = useState<string | null>(highlightId)

  // Scroll to the row the email's "Mark done" button pointed at, once, then let
  // the pulse fade so it stops competing with the overdue accent.
  useEffect(() => {
    if (!highlightId || scrolledRef.current) return
    const el = rowRefs.current[highlightId]
    if (!el) return
    scrolledRef.current = true
    const reduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    el.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'center',
    })
    const timer = setTimeout(() => setPulseId(null), 2500)
    return () => clearTimeout(timer)
  }, [highlightId, items])

  const sections = useMemo(() => groupCommitments(items), [items])

  const { total, done, open, overdue, dueThisWeek } = useMemo(() => {
    const t = items.length
    const d = items.filter(i => i.completed).length
    return {
      total: t,
      done: d,
      open: t - d,
      overdue: items.filter(i => bucketOf(i) === 'overdue').length,
      dueThisWeek: items.filter(i => bucketOf(i) === 'week').length,
    }
  }, [items])

  // The pending gate matters: without it the celebration flashes during the
  // last in-flight toggle and vanishes again if that request fails.
  const allDone = total > 0 && open === 0 && pendingIds.size === 0
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="min-h-screen bg-surface-1 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header — left-aligned so it reads as a tool, and aligns with the rows */}
        <header className="mb-8">
          {/* The logo asset is white-on-transparent, so it needs a dark chip
              (mirrors the email's black header band) */}
          <div className="inline-flex items-center justify-center bg-ink rounded-lg px-4 py-2.5 mb-6">
            <Image
              src="/novus-global-logo.webp"
              alt="Novus Global"
              width={92}
              height={30}
              priority
            />
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-4 mb-1.5">
            Weekly check-in · {format(new Date(), 'MMM d')}
          </p>
          <h1 className="text-[28px] leading-8 font-bold text-ink mb-2">
            {allDone
              ? `${data.client_first_name}, that's everything`
              : `${data.client_first_name}, here's what's open`}
          </h1>
          {data.coach_name && (
            <p className="text-sm text-ink-3">
              Coaching with {data.coach_name}
            </p>
          )}
          {total > 0 && (
            <p className="text-[13px] text-ink-3 mt-3">
              Tap the circle when something&apos;s done. Tap the date to move
              it.
            </p>
          )}

          {total > 0 && (
            <div className="mt-6">
              <p className="text-ink mb-2">
                <span className="text-xl font-semibold">
                  {done} / {total}
                </span>{' '}
                <span className="text-[13px] text-ink-3">done this week</span>
              </p>
              <div
                role="progressbar"
                aria-valuenow={done}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label="Commitments completed this week"
                className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-forest rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {(overdue > 0 || dueThisWeek > 0) && (
                <p className="text-[13px] mt-2">
                  {overdue > 0 && (
                    <span className="text-vermillion font-medium">
                      {overdue} overdue
                    </span>
                  )}
                  {overdue > 0 && dueThisWeek > 0 && (
                    <span className="text-ink-4"> · </span>
                  )}
                  {dueThisWeek > 0 && (
                    <span className="text-ink-3">
                      {dueThisWeek} due this week
                    </span>
                  )}
                </p>
              )}
            </div>
          )}
        </header>

        {allDone && (
          <div className="mb-6 p-5 bg-forest-bg border border-forest rounded-xl text-center">
            <CheckCircle2 className="h-10 w-10 text-forest mx-auto mb-3 animate-in zoom-in duration-300 motion-reduce:animate-none" />
            <p className="text-sm font-semibold text-ink mb-1">
              All clear for this week
            </p>
            <p className="text-[13px] text-ink-3">
              {done} {done === 1 ? 'commitment' : 'commitments'} closed out
              {data.coach_name
                ? `. ${data.coach_name} will see this before your next session.`
                : '.'}
            </p>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          sections.map(section => (
            <CheckinSection
              key={section.key}
              bucket={section.key}
              title={section.title}
              count={section.items.length}
            >
              {section.items.map(item => (
                <CheckinRow
                  key={item.id}
                  ref={el => {
                    rowRefs.current[item.id] = el
                  }}
                  item={item}
                  pending={pendingIds.has(item.id)}
                  error={rowErrors[item.id]}
                  highlighted={pulseId === item.id}
                  onToggle={() => void checkin.toggle(item)}
                  onReschedule={date => void checkin.reschedule(item, date)}
                />
              ))}
            </CheckinSection>
          ))
        )}

        <p className="text-center text-xs text-ink-4 mt-10">
          Changes save as you make them.
        </p>
        <p className="text-center text-xs text-ink-4 mt-2">
          Powered by Novus Global
        </p>

        {/* Two regions, not one — politeness is a property of the element. */}
        <div aria-live="polite" className="sr-only">
          {politeMessage}
        </div>
        <div aria-live="assertive" className="sr-only">
          {assertiveMessage}
        </div>
      </div>
    </div>
  )
}
