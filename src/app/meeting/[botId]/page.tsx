'use client'

import { useParams } from 'next/navigation'
import { TranscriptViewer } from '@/components/transcript-viewer'
import { CoachingPanel } from '@/components/coaching-panel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MeetingLoading } from '@/components/meeting-loading'
import { MeetingError } from '@/components/meeting-error'
import { MeetingHeader } from '@/components/meeting-header'
import { MeetingInfo } from '@/components/meeting-info'
import { useBotData } from '@/hooks/use-bot-data'
import { useBotActions } from '@/hooks/use-bot-actions'

export default function MeetingPage() {
  const params = useParams()
  const botId = params.botId as string

  const { bot, transcript, loading, error } = useBotData(botId)
  const { stopBot, isLoading: isStoppingBot } = useBotActions()

  const handleStopBot = async () => {
    if (!bot) return

    const success = await stopBot(bot.id)
    if (!success) {
      alert('Failed to stop bot')
    }
  }

  if (loading) {
    return <MeetingLoading />
  }

  if (error) {
    return <MeetingError error={error} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-6 px-4">
        <MeetingHeader
          bot={bot}
          onStopBot={handleStopBot}
          isStoppingBot={isStoppingBot}
        />

        {bot && (
          <>
            <MeetingInfo
              bot={bot}
              transcript={transcript}
              onStopBot={handleStopBot}
            />
            <Separator className="my-6" />
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Live Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <TranscriptViewer transcript={transcript} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <CoachingPanel botId={botId} />
          </div>
        </div>
      </div>
    </div>
  )
}
