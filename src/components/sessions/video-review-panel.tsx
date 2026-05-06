'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { Share2, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/contexts/permission-context'
import {
  VideoPlayer,
  VideoPlayerHandle,
  VideoPlayerMarker,
} from './video-player'
import {
  TranscriptPane,
  TranscriptPaneEntry,
  TranscriptPaneHandle,
} from './transcript-pane'
import { CommentsSidebar, CommentsSidebarHandle } from './comments-sidebar'
import { ShareSessionDialog } from './share-session-dialog'
import { useVideoComments } from '@/hooks/queries/use-video-comments'
import {
  useCreateVideoComment,
  useDeleteVideoComment,
  useUpdateVideoComment,
} from '@/hooks/mutations/use-video-comment-mutations'
import { useVideoReviewShortcuts } from '@/hooks/use-video-review-shortcuts'
import { cn } from '@/lib/utils'

interface VideoReviewPanelProps {
  sessionId: string
  videoUrl: string | null | undefined
  videoUnavailable?: boolean
  /** Wall-clock time of video t=0 — typically `metadata.recording_started_at`. */
  videoAnchorAt: string | null | undefined
  transcript: TranscriptPaneEntry[]
  isOwner: boolean
  onRefreshVideoUrl?: () => Promise<void>
  className?: string
}

export function VideoReviewPanel({
  sessionId,
  videoUrl,
  videoUnavailable = false,
  videoAnchorAt,
  transcript,
  isOwner,
  onRefreshVideoUrl,
  className,
}: VideoReviewPanelProps) {
  const { userId } = useAuth()
  const permissions = usePermissions()
  const isAdmin = permissions.isAdmin()

  const playerRef = useRef<VideoPlayerHandle>(null)
  const transcriptRef = useRef<TranscriptPaneHandle>(null)
  const commentsRef = useRef<CommentsSidebarHandle>(null)
  const isPlayingRef = useRef<boolean>(false)

  const [currentTime, setCurrentTime] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const commentsQuery = useVideoComments(sessionId)
  const createCommentMut = useCreateVideoComment(sessionId)
  const updateCommentMut = useUpdateVideoComment(sessionId)
  const deleteCommentMut = useDeleteVideoComment(sessionId)

  const comments = commentsQuery.data ?? []

  // Replies inherit their parent's offset and don't get their own scrubber
  // dot or J/K stop. Filter once and reuse for markers + navigation.
  const topLevelComments = useMemo(
    () => comments.filter(c => !c.parent_id),
    [comments],
  )
  const replyCountByParent = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of comments) {
      if (c.parent_id) {
        map.set(c.parent_id, (map.get(c.parent_id) ?? 0) + 1)
      }
    }
    return map
  }, [comments])

  const handleSeek = useCallback((offsetSec: number) => {
    playerRef.current?.seekTo(offsetSec, { play: true })
    isPlayingRef.current = true
  }, [])

  const handleAddCommentAt = useCallback((offsetSec: number) => {
    commentsRef.current?.focusComposer(offsetSec)
  }, [])

  const markers = useMemo<VideoPlayerMarker[]>(() => {
    return topLevelComments.map(c => {
      const replies = replyCountByParent.get(c.id) ?? 0
      const author = c.author_name || c.author_email || 'Coach'
      const tail = replies > 0 ? ` (+${replies})` : ''
      return {
        id: c.id,
        offsetSec: c.video_offset_seconds,
        tone: c.author_id === userId ? 'mine' : 'comment',
        label: `${author}: ${c.content.slice(0, 80)}${tail}`,
      }
    })
  }, [topLevelComments, replyCountByParent, userId])

  const handleMarkerClick = useCallback(
    (id: string) => {
      const c = topLevelComments.find(x => x.id === id)
      if (c) handleSeek(c.video_offset_seconds)
    },
    [topLevelComments, handleSeek],
  )

  const togglePlay = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (p.isPlaying()) p.pause()
    else void p.play()
    isPlayingRef.current = p.isPlaying()
  }, [])

  const seekRelative = useCallback((delta: number) => {
    const p = playerRef.current
    if (!p) return
    p.seekTo(Math.max(0, p.getCurrentTime() + delta))
  }, [])

  const jumpToPrevComment = useCallback(() => {
    const t = playerRef.current?.getCurrentTime() ?? 0
    const sorted = [...topLevelComments].sort(
      (a, b) => a.video_offset_seconds - b.video_offset_seconds,
    )
    let target = sorted.filter(c => c.video_offset_seconds < t - 0.5).pop()
    if (!target && sorted.length > 0) target = sorted[0]
    if (target) handleSeek(target.video_offset_seconds)
  }, [topLevelComments, handleSeek])

  const jumpToNextComment = useCallback(() => {
    const t = playerRef.current?.getCurrentTime() ?? 0
    const sorted = [...topLevelComments].sort(
      (a, b) => a.video_offset_seconds - b.video_offset_seconds,
    )
    const target = sorted.find(c => c.video_offset_seconds > t + 0.5)
    if (target) handleSeek(target.video_offset_seconds)
  }, [topLevelComments, handleSeek])

  const hasPlayableVideo = !!videoUrl && !videoUnavailable

  useVideoReviewShortcuts({
    // Always enabled — when there's no playable video, the player ref is
    // null so togglePlay / seekRelative / jumpTo* short-circuit harmlessly.
    // We still want C / T / ? available on transcript-only sessions.
    enabled: true,
    togglePlay,
    seekRelative,
    jumpToPrevComment,
    jumpToNextComment,
    focusComposer: () => commentsRef.current?.focusComposer(),
    focusTranscriptSearch: () => transcriptRef.current?.focusSearch(),
    showHelp: () => setHelpOpen(true),
  })

  const playerColumn = (
    <div className="space-y-3">
      <VideoPlayer
        ref={playerRef}
        sessionId={sessionId}
        videoUrl={videoUrl}
        videoUnavailable={videoUnavailable}
        onRefresh={onRefreshVideoUrl ?? (async () => undefined)}
        onTimeUpdate={t => {
          setCurrentTime(t)
          isPlayingRef.current = !!playerRef.current?.isPlaying()
        }}
        markers={markers}
        onMarkerClick={handleMarkerClick}
      />
    </div>
  )

  const transcriptPane = (
    <TranscriptPane
      ref={transcriptRef}
      transcript={transcript}
      videoAnchorAt={videoAnchorAt}
      currentTimeSec={currentTime}
      onSeek={handleSeek}
      onAddCommentAt={handleAddCommentAt}
      className="h-full"
    />
  )

  const commentsPane = (
    <CommentsSidebar
      ref={commentsRef}
      sessionId={sessionId}
      comments={comments}
      isLoading={commentsQuery.isLoading}
      currentUserId={userId}
      isAdmin={isAdmin}
      currentTimeSec={currentTime}
      getCurrentTime={() => playerRef.current?.getCurrentTime() ?? 0}
      hasPlayableVideo={hasPlayableVideo}
      onSeek={handleSeek}
      onPause={() => playerRef.current?.pause()}
      onResume={() => void playerRef.current?.play()}
      isPlayingRef={isPlayingRef}
      onCreate={data => createCommentMut.mutateAsync(data)}
      onUpdate={(commentId, content) =>
        updateCommentMut.mutateAsync({ commentId, content })
      }
      onDelete={commentId => deleteCommentMut.mutateAsync(commentId)}
      className="h-full"
    />
  )

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900">
          Session review
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHelpOpen(true)}
            title="Keyboard shortcuts"
            className="text-gray-500 hover:text-gray-700"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          {(isOwner || isAdmin) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareOpen(true)}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              Share
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">{playerColumn}</div>
        <div className="hidden lg:block">{commentsPane}</div>
      </div>

      <div className="hidden lg:block">{transcriptPane}</div>

      <div className="lg:hidden">
        <Tabs defaultValue="transcript">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="comments">
              Comments {comments.length > 0 ? `(${comments.length})` : ''}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="transcript" className="mt-3">
            {transcriptPane}
          </TabsContent>
          <TabsContent value="comments" className="mt-3">
            {commentsPane}
          </TabsContent>
        </Tabs>
      </div>

      {(isOwner || isAdmin) && (
        <ShareSessionDialog
          sessionId={sessionId}
          open={shareOpen}
          onOpenChange={setShareOpen}
        />
      )}

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>
              Faster navigation while reviewing.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 text-sm">
            <ShortcutRow keys="Space" label="Play / pause" />
            <ShortcutRow keys="← / →" label="Seek ±5 seconds" />
            <ShortcutRow keys="Shift + ← / →" label="Seek ±15 seconds" />
            <ShortcutRow keys="J / K" label="Previous / next comment" />
            <ShortcutRow keys="C" label="Comment at current moment" />
            <ShortcutRow keys="T" label="Search the transcript" />
            <ShortcutRow keys="?" label="Show this help" />
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1">
      <span className="text-gray-700">{label}</span>
      <kbd className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700">
        {keys}
      </kbd>
    </li>
  )
}
