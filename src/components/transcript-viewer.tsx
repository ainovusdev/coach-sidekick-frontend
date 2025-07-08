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
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  if (transcript.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">🎤</div>
        <p className="text-gray-500">
          Waiting for transcript data... The bot needs to join the meeting
          first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
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
