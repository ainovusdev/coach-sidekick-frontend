import { BotStatus } from '@/components/bot-status'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, TranscriptEntry } from '@/types/meeting'

interface MeetingInfoProps {
  bot: Bot
  transcript: TranscriptEntry[]
  onStopBot: () => void
}

export function MeetingInfo({ bot, transcript, onStopBot }: MeetingInfoProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Meeting Session
            <Badge variant="outline">{bot.id}</Badge>
          </CardTitle>
          <BotStatus bot={bot} onStop={onStopBot} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Platform:</span>
            <p className="capitalize">{bot.platform || 'Unknown'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Meeting ID:</span>
            <p>{bot.meeting_id || 'N/A'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">
              Transcript Entries:
            </span>
            <p>{transcript.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
