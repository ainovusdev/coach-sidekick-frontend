'use client'

/** Non-happy-path screens plus the loading skeleton for the check-in page. */

import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center px-4">
      <div className="text-center max-w-md">{children}</div>
    </div>
  )
}

/**
 * A layout-matched skeleton rather than a centred spinner — the cheapest
 * perceived-performance win available on a page whose median visit is a tap
 * from an email on mobile data.
 */
export function CheckinSkeleton() {
  return (
    <div className="min-h-screen bg-surface-1 py-8 px-4" aria-busy="true">
      <div className="max-w-lg mx-auto animate-pulse">
        <div className="h-11 w-32 bg-surface-3 rounded-lg mb-8" />
        <div className="h-3 w-40 bg-surface-3 rounded mb-4" />
        <div className="h-7 w-64 bg-surface-3 rounded mb-3" />
        <div className="h-4 w-44 bg-surface-3 rounded mb-8" />
        <div className="h-1.5 w-full bg-surface-3 rounded-full mb-10" />
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="h-[72px] bg-paper rounded-xl border border-line"
            />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading your commitments…</span>
    </div>
  )
}

/**
 * Dead end — the token really is gone. No Retry button: retrying a 404 is
 * theatre. The coach is referred to generically because the failed request
 * means we never learned their name.
 */
export function ExpiredScreen() {
  return (
    <Shell>
      <div className="w-16 h-16 bg-surface-3 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="h-8 w-8 text-ink-4" />
      </div>
      <h1 className="text-xl font-semibold text-ink mb-3">
        This link has expired
      </h1>
      <p className="text-ink-3 leading-relaxed">
        Check-in links last a couple of weeks. A fresh one arrives with your
        Monday summary — or ask your coach to send a new one.
      </p>
    </Shell>
  )
}

/** Recoverable: the request failed, the token may well be fine. */
export function LoadFailedScreen({
  onRetry,
  attempts,
}: {
  onRetry: () => void
  attempts: number
}) {
  return (
    <Shell>
      <div className="w-16 h-16 bg-surface-3 rounded-full flex items-center justify-center mx-auto mb-6">
        <WifiOff className="h-8 w-8 text-ink-4" />
      </div>
      <h1 className="text-xl font-semibold text-ink mb-3">
        We couldn&apos;t load your check-in
      </h1>
      <p className="text-ink-3 leading-relaxed mb-6">
        Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-lg bg-ink text-paper text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
      {attempts >= 3 && (
        <p className="text-xs text-ink-4 mt-6">
          If this keeps happening, let your coach know.
        </p>
      )}
    </Shell>
  )
}

export function EmptyState() {
  return (
    <div className="text-center py-12 bg-paper rounded-xl border border-line">
      <p className="text-sm font-medium text-ink mb-1">
        Nothing open right now
      </p>
      <p className="text-sm text-ink-3">
        You have a clear plate. Enjoy the week.
      </p>
    </div>
  )
}
