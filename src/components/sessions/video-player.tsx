'use client'

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Video,
  RefreshCw,
  AlertCircle,
  Loader2,
  VideoOff,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export type VideoPlayerHandle = {
  seekTo: (seconds: number, options?: { play?: boolean }) => void
  getCurrentTime: () => number
  play: () => Promise<void>
  pause: () => void
  isPlaying: () => boolean
  getDuration: () => number
}

export type VideoPlayerMarker = {
  id: string
  offsetSec: number
  tone?: 'comment' | 'mine'
  label?: string
}

interface VideoPlayerProps {
  videoUrl: string | null | undefined
  sessionId: string
  onRefresh: () => Promise<void>
  className?: string
  onTimeUpdate?: (currentTimeSec: number) => void
  onDurationChange?: (durationSec: number) => void
  markers?: VideoPlayerMarker[]
  onMarkerClick?: (markerId: string) => void
  /**
   * When true, the recording is permanently unavailable (Recall.ai's media
   * TTL elapsed before we copied it to S3). Renders a terminal empty state
   * with no Refresh button — clicking it would just 404 again.
   */
  videoUnavailable?: boolean
  /**
   * When provided, renders a Download button that resolves a fresh, download-
   * flavored URL (server sets Content-Disposition: attachment) and saves the
   * file. Omit to hide the button (watch-only).
   */
  getDownloadUrl?: () => Promise<string | null>
}

const TIME_UPDATE_INTERVAL_MS = 250

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0)
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer(
    {
      videoUrl,
      sessionId: _sessionId,
      onRefresh,
      className,
      onTimeUpdate,
      onDurationChange,
      markers,
      onMarkerClick,
      videoUnavailable = false,
      getDownloadUrl,
    },
    ref,
  ) {
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [duration, setDuration] = useState(0)
    const videoRef = useRef<HTMLVideoElement>(null)
    const lastEmittedRef = useRef<number>(0)

    useImperativeHandle(
      ref,
      (): VideoPlayerHandle => ({
        seekTo: (seconds, opts) => {
          const v = videoRef.current
          if (!v) return
          v.currentTime = Math.max(0, seconds)
          if (opts?.play) {
            v.play().catch(() => {
              /* user gesture probably required */
            })
          }
        },
        getCurrentTime: () => videoRef.current?.currentTime ?? 0,
        play: async () => {
          const v = videoRef.current
          if (v) await v.play()
        },
        pause: () => videoRef.current?.pause(),
        isPlaying: () => {
          const v = videoRef.current
          return !!v && !v.paused && !v.ended
        },
        getDuration: () => videoRef.current?.duration ?? 0,
      }),
      [],
    )

    const handleVideoError = useCallback(() => {
      setError(true)
      setLoading(false)
    }, [])

    const handleVideoLoad = useCallback(() => {
      setLoading(false)
      setError(false)
    }, [])

    const handleLoadedMetadata = useCallback(() => {
      const v = videoRef.current
      if (v && Number.isFinite(v.duration)) {
        setDuration(v.duration)
        onDurationChange?.(v.duration)
      }
    }, [onDurationChange])

    const handleTimeUpdate = useCallback(() => {
      if (!onTimeUpdate) return
      const v = videoRef.current
      if (!v) return
      const now = performance.now()
      if (now - lastEmittedRef.current < TIME_UPDATE_INTERVAL_MS) return
      lastEmittedRef.current = now
      onTimeUpdate(v.currentTime)
    }, [onTimeUpdate])

    const handleSeeked = useCallback(() => {
      const v = videoRef.current
      if (v && onTimeUpdate) onTimeUpdate(v.currentTime)
    }, [onTimeUpdate])

    const handleRefresh = useCallback(async () => {
      setRefreshing(true)
      setError(false)
      try {
        await onRefresh()
        setLoading(true)
      } catch (err) {
        console.error('Failed to refresh video URL:', err)
        setError(true)
      } finally {
        setRefreshing(false)
      }
    }, [onRefresh])

    const handleDownload = useCallback(async () => {
      if (!getDownloadUrl) return
      setDownloading(true)
      try {
        const url = await getDownloadUrl()
        if (!url) {
          toast.error('Download link is not available for this recording.')
          return
        }
        // The URL carries Content-Disposition: attachment, so a plain anchor
        // click saves the file (streamed to disk) instead of navigating.
        const a = document.createElement('a')
        a.href = url
        a.download = ''
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
      } catch (err) {
        console.error('Failed to download video:', err)
        toast.error('Could not download the recording. Please try again.')
      } finally {
        setDownloading(false)
      }
    }, [getDownloadUrl])

    // Reset emit timer when video URL changes
    useEffect(() => {
      lastEmittedRef.current = 0
    }, [videoUrl])

    const visibleMarkers = useMemo(() => {
      if (!markers || duration <= 0) return []
      return markers
        .filter(
          m =>
            Number.isFinite(m.offsetSec) &&
            m.offsetSec >= 0 &&
            m.offsetSec <= duration,
        )
        .map(m => ({
          ...m,
          leftPercent: Math.min(100, (m.offsetSec / duration) * 100),
        }))
    }, [markers, duration])

    if (videoUnavailable) {
      return (
        <Card className={cn('border-line', className)}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="h-5 w-5" />
              Session Recording
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <VideoOff className="h-12 w-12 text-amber-token mb-4" />
              <h3 className="text-lg font-semibold text-ink mb-2">
                Recording no longer available
              </h3>
              <p className="text-ink-3 max-w-md">
                This session was recorded, but the video file expired before it
                could be archived. The transcript and analysis are still
                available below.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (!videoUrl) {
      return (
        <Card className={cn('border-line', className)}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="h-5 w-5" />
              Session Recording
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <VideoOff className="h-12 w-12 text-ink-2 mb-4" />
              <h3 className="text-lg font-semibold text-ink mb-2">
                No Recording Available
              </h3>
              <p className="text-ink-3 max-w-md">
                This session does not have a video recording. Recordings are
                only available for sessions conducted with the meeting bot.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (error && !refreshing) {
      return (
        <Card className={cn('border-line', className)}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="h-5 w-5" />
              Session Recording
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-amber-token mb-4" />
              <h3 className="text-lg font-semibold text-ink mb-2">
                Video URL Expired
              </h3>
              <p className="text-ink-3 mb-6 max-w-md">
                The video link has expired. Click the button below to get a
                fresh link.
              </p>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-ink hover:bg-ink-2 text-ink-on-dark"
              >
                {refreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Video Link
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className={cn('border-line', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="h-5 w-5" />
              Session Recording
            </CardTitle>
            <div className="flex items-center gap-2">
              {getDownloadUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="border-line-strong hover:bg-paper"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-line-strong hover:bg-paper"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-lg overflow-hidden bg-ink">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink z-10">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 text-ink-on-dark animate-spin mb-2" />
                  <p className="text-ink-on-dark text-sm">Loading video...</p>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              src={videoUrl}
              controls
              controlsList="nodownload"
              className="w-full aspect-video"
              onError={handleVideoError}
              onLoadedData={handleVideoLoad}
              onCanPlay={handleVideoLoad}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onSeeked={handleSeeked}
              preload="metadata"
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {visibleMarkers.length > 0 && (
            <div className="mt-2">
              <div className="relative h-3 w-full rounded bg-surface-3">
                {visibleMarkers.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onMarkerClick?.(m.id)}
                    title={`${formatClock(m.offsetSec)}${m.label ? ` — ${m.label}` : ''}`}
                    className={cn(
                      'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full transition-transform hover:scale-150',
                      m.tone === 'mine'
                        ? 'bg-indigo ring-1 ring-indigo'
                        : 'bg-amber-token ring-1 ring-amber-token',
                    )}
                    style={{ left: `${m.leftPercent}%` }}
                  />
                ))}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-ink-4">
                <span>0:00</span>
                <span>{formatClock(duration)}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-ink-3 mt-3 text-center">
            Video links expire periodically. If playback fails, click the
            refresh button to get a new link.
          </p>
        </CardContent>
      </Card>
    )
  },
)
