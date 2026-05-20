'use client'

import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from 'react'
import { Search, X, MessageSquarePlus, Crosshair } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  formatVideoOffset,
  useSyncedTranscript,
} from '@/hooks/use-synced-transcript'

export interface TranscriptPaneEntry {
  id: string
  speaker: string
  text: string
  timestamp: string
}

export type TranscriptPaneHandle = {
  focusSearch: () => void
  scrollToActive: () => void
}

interface TranscriptPaneProps {
  transcript: TranscriptPaneEntry[]
  /** Wall-clock time corresponding to video t=0. See useSyncedTranscript. */
  videoAnchorAt: string | null | undefined
  currentTimeSec: number
  onSeek: (offsetSec: number) => void
  onAddCommentAt?: (offsetSec: number) => void
  className?: string
}

const SPEAKER_PALETTE = [
  'bg-indigo-bg text-indigo ring-indigo',
  'bg-forest-bg text-forest ring-forest',
  'bg-amber-token-bg text-amber-token ring-amber-token',
  'bg-vermillion-bg text-vermillion ring-vermillion',
  'bg-ds-accent-bg text-ds-accent ring-ds-accent',
  'bg-indigo-bg text-indigo ring-indigo',
]

function speakerSwatch(speaker: string): string {
  let hash = 0
  for (let i = 0; i < speaker.length; i++) {
    hash = (hash * 31 + speaker.charCodeAt(i)) | 0
  }
  return SPEAKER_PALETTE[Math.abs(hash) % SPEAKER_PALETTE.length]
}

function highlightMatch(text: string, needle: string): React.ReactNode {
  if (!needle) return text
  const idx = text.toLowerCase().indexOf(needle.toLowerCase())
  if (idx === -1) return text
  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + needle.length)
  const after = text.slice(idx + needle.length)
  return (
    <>
      {before}
      <mark className="rounded bg-amber-token-bg px-0.5 text-ink">{match}</mark>
      {after}
    </>
  )
}

export const TranscriptPane = forwardRef<
  TranscriptPaneHandle,
  TranscriptPaneProps
>(function TranscriptPane(
  {
    transcript,
    videoAnchorAt,
    currentTimeSec,
    onSeek,
    onAddCommentAt,
    className,
  },
  ref,
) {
  const [search, setSearch] = useState('')
  const [matchIndex, setMatchIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const getTimestamp = useCallback((e: TranscriptPaneEntry) => e.timestamp, [])

  const { entries, activeIndex } = useSyncedTranscript({
    transcript,
    videoAnchorAt,
    currentTimeSec,
    getTimestamp,
  })

  // Center the active row inside the transcript's own scroll container.
  // Container-scoped (no scrollIntoView) so the page itself never scrolls.
  const scrollToActive = useCallback(() => {
    const container = containerRef.current
    if (!container || activeIndex < 0) return
    const activeEntry = entries[activeIndex]
    if (!activeEntry) return
    const node = rowRefs.current[activeEntry.entry.id]
    if (!node) return
    const target =
      node.offsetTop - container.clientHeight / 2 + node.clientHeight / 2
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [activeIndex, entries])

  useImperativeHandle(
    ref,
    () => ({
      focusSearch: () => searchRef.current?.focus(),
      scrollToActive,
    }),
    [scrollToActive],
  )

  const matches = useMemo(() => {
    if (!search.trim()) return [] as number[]
    const needle = search.trim().toLowerCase()
    return entries
      .map((e, i) => (e.entry.text.toLowerCase().includes(needle) ? i : -1))
      .filter(i => i >= 0)
  }, [entries, search])

  useEffect(() => {
    setMatchIndex(0)
  }, [search])

  const handleSearchKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (matches.length === 0) return
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        const next = (matchIndex + 1) % matches.length
        setMatchIndex(next)
        const target = entries[matches[next]]
        if (target) onSeek(target.offsetSec)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const next = (matchIndex - 1 + matches.length) % matches.length
        setMatchIndex(next)
        const target = entries[matches[next]]
        if (target) onSeek(target.offsetSec)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setSearch('')
        searchRef.current?.blur()
      }
    },
    [entries, matches, matchIndex, onSeek],
  )

  const visibleMatchSet = useMemo(() => new Set(matches), [matches])

  return (
    <Card className={cn('border-line flex flex-col', className)}>
      <CardHeader className="border-b border-line py-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold text-ink">
            Transcript
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeIndex >= 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={scrollToActive}
                title="Scroll the transcript to where the video is"
                className="h-7 px-2 text-xs text-indigo hover:bg-indigo-bg hover:text-indigo"
              >
                <Crosshair className="h-3.5 w-3.5 mr-1" />
                Jump to current
              </Button>
            )}
            <Badge variant="secondary" className="text-xs">
              {entries.length} {entries.length === 1 ? 'line' : 'lines'}
            </Badge>
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-4" />
          <Input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="Search transcript… (Enter / ↑↓ to navigate)"
            className="h-8 pl-8 pr-16 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink-3"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {search && matches.length > 0 && (
            <span className="absolute right-7 top-1/2 -translate-y-1/2 text-[11px] text-ink-3">
              {matchIndex + 1}/{matches.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-ink-3">
            {videoAnchorAt
              ? 'Transcript not available yet — usually ready a minute or two after the session ends.'
              : 'Session timing data is not available, so the transcript cannot be synced with the video.'}
          </div>
        ) : (
          <div
            ref={containerRef}
            className="max-h-[28rem] overflow-y-auto divide-y divide-line"
            role="list"
            aria-label="Transcript synced with video"
          >
            {entries.map(({ entry, offsetSec }, i) => {
              const isActive = i === activeIndex
              const isMatch = visibleMatchSet.has(i)
              return (
                <div
                  key={entry.id}
                  ref={node => {
                    rowRefs.current[entry.id] = node
                  }}
                  role="listitem"
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'group relative px-4 py-3 transition-colors',
                    isActive
                      ? 'bg-indigo-bg/70 border-l-4 border-l-indigo-500 pl-3'
                      : 'border-l-4 border-l-transparent hover:bg-paper',
                    isMatch && !isActive && 'bg-amber-token-bg/60',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => onSeek(offsetSec)}
                      className="shrink-0 rounded font-mono text-[11px] text-ink-3 hover:text-indigo hover:underline"
                      title="Jump to this moment"
                    >
                      {formatVideoOffset(offsetSec)}
                    </button>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1',
                        speakerSwatch(entry.speaker),
                      )}
                    >
                      {entry.speaker}
                    </span>
                    <p
                      className={cn(
                        'flex-1 text-sm leading-relaxed cursor-pointer',
                        isActive ? 'text-ink' : 'text-ink-2',
                      )}
                      onClick={() => onSeek(offsetSec)}
                    >
                      {highlightMatch(entry.text, search.trim())}
                    </p>
                    {onAddCommentAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2 text-xs"
                        onClick={() => onAddCommentAt(offsetSec)}
                        title="Comment on this moment"
                      >
                        <MessageSquarePlus className="h-3.5 w-3.5 mr-1" />
                        Comment
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
})
