import { Card, CardContent } from '@/components/ui/card'
import { TranscriptViewer } from '@/components/meeting/transcript-viewer'
import { CoachingPanel } from '@/components/meeting/coaching-panel'
import { cn } from '@/lib/utils'
import { TranscriptEntry } from '@/types/meeting'

interface MeetingPanelsProps {
  transcript: TranscriptEntry[]
  botId: string
  showDebug: boolean
}

export default function MeetingPanels({ transcript, botId, showDebug }: MeetingPanelsProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-300",
      showDebug ? "h-[450px]" : "h-[700px]"
    )}>
      <Card className="shadow-md h-full flex flex-col overflow-hidden">
        <CardContent className="p-6 flex-1 min-h-0 overflow-auto">
          <TranscriptViewer transcript={transcript} />
        </CardContent>
      </Card>
      <div className="flex flex-col h-full overflow-hidden">
        <CoachingPanel botId={botId} className="shadow-lg h-full" />
      </div>
    </div>
  )
}