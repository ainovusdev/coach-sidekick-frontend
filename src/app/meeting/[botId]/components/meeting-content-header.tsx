import { Badge } from '@/components/ui/badge'
import { Brain, MessageSquare } from 'lucide-react'

interface MeetingContentHeaderProps {
  transcriptLength: number
}

export default function MeetingContentHeader({ transcriptLength }: MeetingContentHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <h1 className="text-xl font-bold text-gray-900">
            AI Coaching Assistant
          </h1>
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-700"
          >
            Real-time
          </Badge>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Live Transcript
          </h2>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {transcriptLength} entries
          </Badge>
        </div>
      </div>
    </div>
  )
}