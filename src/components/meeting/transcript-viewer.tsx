'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatTime } from '@/lib/date-utils'

interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
  confidence: number
  is_final: boolean
  start_time?: number
  end_time?: number
}

type ViewMode = 'default' | 'compact' | 'strip' | 'sidebar'

interface TranscriptViewerProps {
  transcript: TranscriptEntry[]
  compact?: boolean
  autoScroll?: boolean
  mode?: ViewMode
}

export function TranscriptViewer({
  transcript,
  compact = false,
  autoScroll = false,
  mode: modeProp,
}: TranscriptViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showFullTranscript, setShowFullTranscript] = useState(false)

  // Determine mode: explicit mode prop takes precedence, otherwise use compact boolean
  const mode: ViewMode = modeProp || (compact ? 'compact' : 'default')

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [transcript, autoScroll])

  // Strip mode - horizontal compact view for bottom strip
  if (mode === 'strip') {
    const recentEntries = transcript.slice(-5)

    return (
      <>
        <div
          className="h-full flex items-center gap-3 px-4 bg-paper rounded-lg cursor-pointer hover:bg-surface-3 transition-colors"
          onClick={() => setShowFullTranscript(true)}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <MessageSquare className="h-4 w-4 text-ink-4" />
            <span className="text-xs font-medium text-ink-3">
              {transcript.length} entries
            </span>
          </div>

          <div className="h-4 w-px bg-line" />

          {recentEntries.length === 0 ? (
            <span className="text-xs text-ink-4 italic">
              Waiting for conversation...
            </span>
          ) : (
            <div className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
              {recentEntries.map((entry, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 max-w-[200px] px-2 py-1 rounded text-xs ${
                    entry.is_final ? 'bg-surface-1' : 'bg-ds-accent-bg'
                  }`}
                >
                  <span className="font-medium text-ink-2">
                    {entry.speaker}:
                  </span>{' '}
                  <span className="text-ink-3 truncate">{entry.text}</span>
                </div>
              ))}
            </div>
          )}

          <ChevronRight className="h-4 w-4 text-ink-4 flex-shrink-0" />
        </div>

        {/* Full Transcript Modal */}
        <Dialog open={showFullTranscript} onOpenChange={setShowFullTranscript}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Live Transcript ({transcript.length} entries)
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-2">
                {transcript.map((entry, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      entry.is_final ? 'bg-paper' : 'bg-ds-accent-bg'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-ink-2">
                        {entry.speaker}
                      </span>
                      {!entry.is_final && (
                        <Badge
                          variant="secondary"
                          className="text-xs py-0 px-1"
                        >
                          Live
                        </Badge>
                      )}
                      <span className="text-xs text-ink-4 ml-auto">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-ink-2">{entry.text}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Sidebar mode - vertical scrolling list for collapsible sidebar
  if (mode === 'sidebar') {
    return (
      <div className="h-full overflow-y-auto">
        <div ref={containerRef} className="p-3 space-y-2">
          {transcript.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-ink-4 text-lg mb-2">🎤</div>
              <p className="text-ink-3 text-sm">Waiting for conversation...</p>
            </div>
          ) : (
            transcript.map((entry, index) => (
              <div
                key={index}
                className={`p-2.5 rounded-lg transition-all duration-300 ${
                  entry.is_final
                    ? 'bg-paper border border-line '
                    : 'bg-ds-accent-bg border border-ds-accent '
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs text-ink-2 ">
                    {entry.speaker}
                  </span>
                  {!entry.is_final && (
                    <Badge
                      variant="secondary"
                      className="text-xs py-0 px-1 h-4"
                    >
                      Live
                    </Badge>
                  )}
                  <span className="text-xs text-ink-4 ml-auto">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed">
                  {entry.text}
                </p>
              </div>
            ))
          )}
          {autoScroll && <div ref={bottomRef} className="h-1" />}
        </div>
      </div>
    )
  }

  if (transcript.length === 0) {
    return (
      <div
        className={
          mode === 'compact' ? 'text-center py-6' : 'text-center py-12'
        }
      >
        <div
          className={
            mode === 'compact'
              ? 'text-ink-4 text-base mb-1'
              : 'text-ink-4 text-lg mb-2'
          }
        >
          🎤
        </div>
        <p
          className={mode === 'compact' ? 'text-ink-3 text-xs' : 'text-ink-3 '}
        >
          {mode === 'compact'
            ? 'Waiting for conversation...'
            : 'Waiting for transcript data... The bot needs to join the meeting first.'}
        </p>
      </div>
    )
  }

  if (mode === 'compact') {
    return (
      <div ref={containerRef} className="space-y-2">
        {transcript.map((entry, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg transition-all duration-300 ${
              entry.is_final ? 'bg-paper ' : 'bg-ds-accent-bg opacity-80'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-xs text-ink-2 ">
                {entry.speaker}
              </span>
              {!entry.is_final && (
                <Badge variant="secondary" className="text-xs py-0 px-1 h-4">
                  Live
                </Badge>
              )}
              <span className="text-xs text-ink-4 ml-auto">
                {formatTime(entry.timestamp)}
              </span>
            </div>
            <p className="text-xs text-ink-2 leading-relaxed">{entry.text}</p>
          </div>
        ))}
        {autoScroll && <div ref={bottomRef} className="h-1" />}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {transcript.map((entry, index) => (
        <Card
          key={index}
          className={`transition-all duration-300 ${
            entry.is_final
              ? 'bg-surface-1 border-line '
              : 'bg-ds-accent-bg border-ds-accent border-dashed'
          }`}
        >
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink ">{entry.speaker}</span>
                <Badge
                  variant={entry.is_final ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {entry.is_final ? 'Final' : 'Live'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {Math.round(entry.confidence * 100)}% confidence
                </Badge>
              </div>
              <span className="text-xs text-ink-3 ">
                {formatTime(entry.timestamp)}
              </span>
            </div>
            <p className="text-ink-2 leading-relaxed">{entry.text}</p>
          </CardContent>
        </Card>
      ))}
      {autoScroll && <div ref={bottomRef} className="h-1" />}
    </div>
  )
}
