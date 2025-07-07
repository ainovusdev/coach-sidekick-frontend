'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Mic, Circle, Clock, MessageSquare, Volume2 } from 'lucide-react'

interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
  confidence?: number
  is_final?: boolean
  start_time?: number
  end_time?: number
}

interface TranscriptViewerProps {
  transcript: TranscriptEntry[]
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  // Debug logging
  console.log('TranscriptViewer render - transcript:', transcript)

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return timestamp
    }
  }

  const getSpeakerColor = (speaker: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    ]

    const hash = speaker.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)

    return colors[Math.abs(hash) % colors.length]
  }

  if (!transcript || transcript.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Live Transcript</span>
            <Badge variant="outline" className="ml-auto text-xs">
              <Circle className="w-2 h-2 mr-1 text-muted-foreground" />
              Waiting
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Waiting for Audio</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              The bot is connecting to the meeting. Transcript will appear here
              once participants start speaking.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-left max-w-md mx-auto mb-6">
              <p className="font-medium mb-2 flex items-center">
                <Volume2 className="w-4 h-4 mr-2" />
                Transcription Tips
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Ensure participants are unmuted</li>
                <li>• Speak clearly for better accuracy</li>
                <li>• May take 30-60 seconds to start</li>
              </ul>
            </div>

            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Live Transcript</span>
          <Badge variant="default" className="ml-auto text-xs">
            <Circle className="w-2 h-2 mr-1 fill-current animate-pulse" />
            Recording
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={scrollRef} className="max-h-[600px] overflow-y-auto">
          <div className="p-6 space-y-4">
            {transcript.map((entry, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getSpeakerColor(entry.speaker)}`}
                  >
                    {entry.speaker}
                  </Badge>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(entry.timestamp)}</span>
                    {entry.confidence && (
                      <span>• {Math.round(entry.confidence * 100)}%</span>
                    )}
                    {entry.is_final === false && (
                      <Badge variant="outline" className="text-xs">
                        live
                      </Badge>
                    )}
                  </div>
                </div>
                <p
                  className={`text-sm leading-relaxed pl-1 ${
                    !entry.is_final ? 'text-muted-foreground italic' : ''
                  }`}
                >
                  {entry.text}
                </p>
                {index < transcript.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t bg-muted/30 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {transcript.length}{' '}
              {transcript.length === 1 ? 'entry' : 'entries'}
            </span>
            <div className="flex items-center space-x-1">
              <Circle className="w-2 h-2 fill-green-500 text-green-500" />
              <span>Live transcription active</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
