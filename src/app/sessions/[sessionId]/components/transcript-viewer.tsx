import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Bot, User, Lock } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import { usePermissions } from '@/contexts/permission-context'

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

export default function TranscriptViewer({
  transcript,
}: TranscriptViewerProps) {
  const permissions = usePermissions()
  const isViewer = permissions.isViewer()

  // Viewers cannot see transcript content
  if (isViewer) {
    return (
      <Card className="hover:shadow-md transition-shadow duration-200 border-line ">
        <CardHeader className="bg-paper border-b border-line ">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-line rounded-lg text-ink-on-dark">
                <Lock className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-ink-2 ">
                Meeting Transcript
              </span>
            </div>
            <Badge
              variant="secondary"
              className="bg-surface-3 text-ink-3 border-line-strong "
            >
              Restricted
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16 text-ink-3 ">
            <div className="w-20 h-20 mx-auto mb-4 bg-surface-3 rounded-full flex items-center justify-center">
              <Lock className="h-10 w-10 text-ink-4" />
            </div>
            <p className="text-lg font-medium text-ink-3 ">
              Transcript Access Restricted
            </p>
            <p className="text-sm text-ink-3 mt-2">
              You do not have permission to view session transcripts.
            </p>
            <p className="text-xs text-ink-4 mt-4">
              Contact your administrator for access.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-line ">
      <CardHeader className="bg-paper border-b border-line ">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-ink rounded-lg text-ink-on-dark ">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-ink ">
              Meeting Transcript
            </span>
          </div>
          <Badge
            variant="secondary"
            className="bg-surface-3 text-ink-2 border-line-strong "
          >
            {transcript.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {transcript.length === 0 ? (
          <div className="text-center py-16 text-ink-3 ">
            <div className="w-20 h-20 mx-auto mb-4 bg-surface-3 rounded-full flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-ink-2 " />
            </div>
            <p className="text-lg font-medium text-ink-4">
              No transcript available
            </p>
            <p className="text-sm text-ink-4 mt-1">
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
                        ? 'bg-paper hover:bg-surface-3 border border-line '
                        : 'bg-surface-1 hover:bg-paper border border-line '
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isBot
                            ? 'bg-surface-3 text-ink-2 '
                            : 'bg-ink text-ink-on-dark '
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
                        <span className="font-semibold text-sm text-ink ">
                          {entry.speaker}
                        </span>
                        <span className="text-xs text-ink-3 bg-surface-3 px-2 py-1 rounded-full">
                          {formatDate(entry.timestamp, 'HH:mm:ss')}
                        </span>
                        {entry.confidence && (
                          <span className="text-xs text-ink-4 bg-paper px-2 py-1 rounded-full">
                            {Math.round(entry.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-ink-2 leading-relaxed">
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
