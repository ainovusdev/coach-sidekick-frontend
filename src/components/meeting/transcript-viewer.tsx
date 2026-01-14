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
          className="h-full flex items-center gap-3 px-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setShowFullTranscript(true)}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">
              {transcript.length} entries
            </span>
          </div>

          <div className="h-4 w-px bg-gray-300" />

          {recentEntries.length === 0 ? (
            <span className="text-xs text-gray-400 italic">
              Waiting for conversation...
            </span>
          ) : (
            <div className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
              {recentEntries.map((entry, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 max-w-[200px] px-2 py-1 rounded text-xs ${
                    entry.is_final ? 'bg-white' : 'bg-blue-50'
                  }`}
                >
                  <span className="font-medium text-gray-700">
                    {entry.speaker}:
                  </span>{' '}
                  <span className="text-gray-600 truncate">{entry.text}</span>
                </div>
              ))}
            </div>
          )}

          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
                      entry.is_final ? 'bg-gray-50' : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-700">
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
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{entry.text}</p>
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
              <div className="text-gray-400 text-lg mb-2">🎤</div>
              <p className="text-gray-500 text-sm">
                Waiting for conversation...
              </p>
            </div>
          ) : (
            transcript.map((entry, index) => (
              <div
                key={index}
                className={`p-2.5 rounded-lg transition-all duration-300 ${
                  entry.is_final
                    ? 'bg-gray-50 border border-gray-100'
                    : 'bg-blue-50 border border-blue-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs text-gray-700">
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
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
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
              ? 'text-gray-400 text-base mb-1'
              : 'text-gray-400 text-lg mb-2'
          }
        >
          🎤
        </div>
        <p
          className={
            mode === 'compact' ? 'text-gray-500 text-xs' : 'text-gray-500'
          }
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
              entry.is_final ? 'bg-gray-50' : 'bg-blue-50 opacity-80'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-xs text-gray-700">
                {entry.speaker}
              </span>
              {!entry.is_final && (
                <Badge variant="secondary" className="text-xs py-0 px-1 h-4">
                  Live
                </Badge>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              {entry.text}
            </p>
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
              ? 'bg-white border-gray-200'
              : 'bg-blue-50 border-blue-200 border-dashed'
          }`}
        >
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {entry.speaker}
                </span>
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
              <span className="text-xs text-gray-500">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-gray-800 leading-relaxed">{entry.text}</p>
          </CardContent>
        </Card>
      ))}
      {autoScroll && <div ref={bottomRef} className="h-1" />}
    </div>
  )
}
