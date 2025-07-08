import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Bot } from '@/types/meeting'

interface MeetingHeaderProps {
  bot: Bot | null
  onStopBot: () => void
  isStoppingBot: boolean
}

export function MeetingHeader({
  bot,
  onStopBot,
  isStoppingBot,
}: MeetingHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between mb-6">
      <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      {bot && (
        <div className="flex items-center gap-2">
          {bot.meeting_url !== '#' && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={bot.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Join Meeting
              </a>
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={onStopBot}
            disabled={bot.status === 'call_ended' || isStoppingBot}
          >
            {isStoppingBot ? 'Stopping...' : 'Stop Bot'}
          </Button>
        </div>
      )}
    </div>
  )
}
