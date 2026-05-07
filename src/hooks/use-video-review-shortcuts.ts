'use client'

import { useEffect } from 'react'

interface ShortcutHandlers {
  togglePlay: () => void
  seekRelative: (deltaSec: number) => void
  jumpToPrevComment: () => void
  jumpToNextComment: () => void
  focusComposer: () => void
  focusTranscriptSearch: () => void
  showHelp: () => void
  enabled?: boolean
}

function isInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

/**
 * Global keyboard shortcuts for the video review surface.
 * Skips firing when an input/textarea is focused, so typing in the
 * comment composer or transcript search isn't disrupted.
 *
 * Bindings:
 *   Space         play/pause
 *   ← / →         seek -5s / +5s
 *   Shift+←/→     seek -15s / +15s
 *   J / K         prev / next comment
 *   C             focus comment composer
 *   T             focus transcript search
 *   ?             show shortcuts help
 */
export function useVideoReviewShortcuts({
  togglePlay,
  seekRelative,
  jumpToPrevComment,
  jumpToNextComment,
  focusComposer,
  focusTranscriptSearch,
  showHelp,
  enabled = true,
}: ShortcutHandlers) {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      if (isInputTarget(e.target)) return
      // Allow combos with cmd/ctrl/alt to pass through.
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seekRelative(e.shiftKey ? -15 : -5)
          break
        case 'ArrowRight':
          e.preventDefault()
          seekRelative(e.shiftKey ? 15 : 5)
          break
        case 'j':
        case 'J':
          e.preventDefault()
          jumpToPrevComment()
          break
        case 'k':
        case 'K':
          e.preventDefault()
          jumpToNextComment()
          break
        case 'c':
        case 'C':
          e.preventDefault()
          focusComposer()
          break
        case 't':
        case 'T':
          e.preventDefault()
          focusTranscriptSearch()
          break
        case '?':
          e.preventDefault()
          showHelp()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    enabled,
    togglePlay,
    seekRelative,
    jumpToPrevComment,
    jumpToNextComment,
    focusComposer,
    focusTranscriptSearch,
    showHelp,
  ])
}
