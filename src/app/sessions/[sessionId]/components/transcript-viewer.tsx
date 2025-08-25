import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Bot, User } from 'lucide-react'
import { format } from 'date-fns'

interface TranscriptEntry {
  id: string
  speaker: string
  text: string
  timestamp: string
  confidence: number | null
  created_at: string
}

interface TranscriptViewerProps {
  transcript: TranscriptEntry[]
}

export default function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-gray-200">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-900 rounded-lg text-white">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              Meeting Transcript
            </span>
          </div>
          <Badge
            variant="secondary"
            className="bg-gray-200 text-gray-700 border-gray-300"
          >
            {transcript.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {transcript.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-400">
              No transcript available
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Messages will appear here once the meeting starts
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="p-6 space-y-4">
              {transcript.map(entry => {
                const isBot =
                  entry.speaker.toLowerCase().includes('bot') ||
                  entry.speaker.toLowerCase().includes('system')
                return (
                  <div
                    key={entry.id}
                    className={`flex gap-3 p-4 rounded-lg transition-colors ${
                      isBot
                        ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isBot
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-gray-900 text-white'
                        }`}
                      >
                        {isBot ? (
                          <Bot className="h-5 w-5" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900">
                          {entry.speaker}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {format(
                            new Date(entry.timestamp),
                            'HH:mm:ss',
                          )}
                        </span>
                        {entry.confidence && (
                          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                            {Math.round(entry.confidence * 100)}%
                            confidence
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {entry.text}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}