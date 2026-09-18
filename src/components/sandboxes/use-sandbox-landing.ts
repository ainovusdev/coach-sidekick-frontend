'use client'

/**
 * Where a link to a sandbox lands, for both the cockpit and the client view.
 *
 * A `#section` anchor comes from a notification or from the dashboard's
 * attention rows and was written before either layout existed, so it wins over
 * `?tab=`: the page picks the place that owns the section, then scrolls to it
 * once that place has painted — an unmounted section has no element to find.
 *
 * A second link to the same sandbox only changes the hash, which the browser
 * handles without reloading, so the same reading runs again on `hashchange`.
 */

import { useCallback, useEffect, useRef } from 'react'
import type { InsightSelection } from '@/types/sandbox-analytics'

export interface SandboxLanding {
  /** The `#section` anchor, without the hash. Empty when there is none. */
  hash: string
  /**
   * `?tab=` exactly as written.
   *
   * Both layouts read this, and they give the same word different meanings —
   * `?tab=timeline` is the cockpit's Today and the client view's Milestones —
   * so the raw string travels and each layout resolves it. The cockpit uses
   * `toSandboxTab`; the client view looks it up in its own section map.
   */
  tab: string | null
  selection: InsightSelection
  /** `?commitment=` — the row whose detail panel opens. */
  commitment: string | null
}

export function readSandboxLanding(): SandboxLanding {
  const params = new URLSearchParams(window.location.search)
  const period = params.get('period')
  return {
    hash: window.location.hash.slice(1),
    tab: params.get('tab'),
    selection: {
      period: period === '30d' || period === '90d' ? period : 'term',
      group_id: params.get('group_id'),
    },
    commitment: params.get('commitment'),
  }
}

let frame = 0

/**
 * Scroll to a section after the next paint. Two frames: one for the tab or
 * section to mount, one for the browser to lay it out.
 */
export function scrollToSection(id: string): void {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }),
  )
}

/** Read the URL on mount and on every later `hashchange`. */
export function useSandboxLanding(
  sandboxId: string,
  onLand: (landing: SandboxLanding) => void,
): void {
  const handler = useRef(onLand)
  handler.current = onLand
  useEffect(() => {
    const land = () => handler.current(readSandboxLanding())
    land()
    window.addEventListener('hashchange', land)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('hashchange', land)
    }
  }, [sandboxId])
}

/** Remember something in the URL without navigating: a refresh comes back here. */
export function replaceParams(
  change: (url: URL) => void,
  { keepHash = true }: { keepHash?: boolean } = {},
): void {
  const url = new URL(window.location.href)
  change(url)
  if (!keepHash) url.hash = ''
  window.history.replaceState(null, '', url.pathname + url.search + url.hash)
}

export function writeSelection(next: InsightSelection): void {
  replaceParams(url => {
    url.searchParams.set('period', next.period)
    if (next.group_id) url.searchParams.set('group_id', next.group_id)
    else url.searchParams.delete('group_id')
  })
}

/**
 * Drop the commitment deep link when the panel closes, so a reload does not
 * reopen it. The comment id goes with it — it only means anything inside.
 */
export function useCloseCommitment(
  setOpen: (id: string | null) => void,
): () => void {
  return useCallback(() => {
    setOpen(null)
    const url = new URL(window.location.href)
    if (!url.searchParams.has('commitment') && !url.searchParams.has('comment'))
      return
    replaceParams(u => {
      u.searchParams.delete('commitment')
      u.searchParams.delete('comment')
    })
  }, [setOpen])
}
