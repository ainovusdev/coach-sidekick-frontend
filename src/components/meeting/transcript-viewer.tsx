'use client'

import { useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
  confidence: number
  is_final: boolean
  start_time?: number
  end_time?: number
}

interface TranscriptViewerProps {
  transcript: TranscriptEntry[]
  compact?: boolean
}

export function TranscriptViewer({ transcript, compact = false }: TranscriptViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  if (transcript.length === 0) {
    return (
      <div className={compact ? "text-center py-6" : "text-center py-12"}>
        <div className={compact ? "text-gray-400 text-base mb-1" : "text-gray-400 text-lg mb-2"}>🎤</div>
        <p className={compact ? "text-gray-500 text-xs" : "text-gray-500"}>
          {compact ? "Waiting for conversation..." : "Waiting for transcript data... The bot needs to join the meeting first."}
        </p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {transcript.map((entry, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg transition-all duration-300 ${
              entry.is_final
                ? 'bg-gray-50'
                : 'bg-blue-50 opacity-80'
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
                  minute: '2-digit' 
                })}
              </span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{entry.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full overflow-y-auto">
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
      <div ref={bottomRef} />
    </div>
  )
}
