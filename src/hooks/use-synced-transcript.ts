'use client'

import { useMemo } from 'react'

export interface SyncedTranscriptEntry<T> {
  entry: T
  offsetSec: number
}

/**
 * Parse an ISO-ish timestamp, treating tz-naive strings as UTC.
 *
 * Backend serializes `transcripts.timestamp` from a naive UTC `DateTime`
 * column via `.isoformat()`, which omits the offset. ECMAScript parses that
 * as local time, while wall-clock fields like `recording_started_at` arrive
 * with `+00:00`. Mixing the two produces an offset equal to the user's UTC
 * offset, so a transcript a few seconds into the call ends up with a large
 * negative offset that gets clamped to 0.
 */
function parseAsUtc(value: string): number {
  if (!value) return Number.NaN
  // Already has a timezone marker (Z or ±HH:MM).
  if (/Z$|[+-]\d\d:?\d\d$/.test(value)) return Date.parse(value)
  // Pure date (no time component) — leave to default parsing rules.
  if (!value.includes('T')) return Date.parse(value)
  // Tz-naive datetime: pin to UTC.
  return Date.parse(value + 'Z')
}

interface UseSyncedTranscriptResult<T> {
  entries: SyncedTranscriptEntry<T>[]
  activeIndex: number
}

interface UseSyncedTranscriptOptions<T> {
  transcript: T[] | null | undefined
  /**
   * Wall-clock time corresponding to t=0 of the video (i.e. when recording
   * actually started). Prefer `session_metadata.recording_started_at` over
   * `session.started_at` — the latter is the session row's creation time and
   * can precede the actual recording by 60-90s, which makes the transcript
   * appear to lag behind the video.
   */
  videoAnchorAt: string | null | undefined
  currentTimeSec: number
  getTimestamp: (entry: T) => string | null | undefined
}

/**
 * Pre-computes a video offset (in seconds) for each transcript entry by
 * subtracting the video anchor, then returns the index of the entry that
 * should be highlighted at `currentTimeSec` (the latest entry whose offset
 * is <= currentTimeSec). Uses binary search.
 */
export function useSyncedTranscript<T>({
  transcript,
  videoAnchorAt,
  currentTimeSec,
  getTimestamp,
}: UseSyncedTranscriptOptions<T>): UseSyncedTranscriptResult<T> {
  const entries = useMemo<SyncedTranscriptEntry<T>[]>(() => {
    if (!transcript || transcript.length === 0 || !videoAnchorAt) return []
    const startMs = parseAsUtc(videoAnchorAt)
    if (Number.isNaN(startMs)) return []

    // Allow a small negative tolerance for transcripts whose timestamps fire
    // a fraction of a second before the recording marker due to clock skew /
    // rounding. Anything earlier than that is genuine pre-recording capture
    // and is dropped — those segments aren't in the video file, so showing
    // them with a clamped 0:00 offset would make the transcript appear ahead
    // of the video.
    const PRE_ANCHOR_TOLERANCE_SEC = 1.5

    const computed: SyncedTranscriptEntry<T>[] = []
    for (const entry of transcript) {
      const ts = getTimestamp(entry)
      if (!ts) continue
      const tsMs = parseAsUtc(ts)
      if (Number.isNaN(tsMs)) continue
      const rawOffsetSec = (tsMs - startMs) / 1000
      if (rawOffsetSec < -PRE_ANCHOR_TOLERANCE_SEC) continue
      const offsetSec = Math.max(0, rawOffsetSec)
      computed.push({ entry, offsetSec })
    }
    computed.sort((a, b) => a.offsetSec - b.offsetSec)
    return computed
  }, [transcript, videoAnchorAt, getTimestamp])

  const activeIndex = useMemo(() => {
    if (entries.length === 0) return -1
    if (currentTimeSec < entries[0].offsetSec) return -1

    let lo = 0
    let hi = entries.length - 1
    let answer = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (entries[mid].offsetSec <= currentTimeSec) {
        answer = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return answer
  }, [entries, currentTimeSec])

  return { entries, activeIndex }
}

export function formatVideoOffset(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0)
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}
