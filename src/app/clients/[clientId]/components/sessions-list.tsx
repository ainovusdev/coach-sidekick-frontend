import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Upload } from 'lucide-react'
import SessionCard from './session-card'

interface ClientSession {
  id: string
  bot_id: string
  status: string
  created_at: string
  meeting_summaries?: Array<{
    duration_minutes: number
    final_overall_score?: number
    meeting_summary: string
  }>
  summary?: string
  key_topics?: string[]
  action_items?: string[]
  duration_seconds?: number
}

interface SessionsListProps {
  sessions: ClientSession[]
  clientId: string
  clientName: string
  onUploadClick: () => void
  onSessionDeleted?: () => void
}

export default function SessionsList({ sessions, clientId, clientName, onUploadClick, onSessionDeleted }: SessionsListProps) {
  return (
    <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between bg-gray-50">
        <CardTitle className="text-lg font-medium text-gray-900">
          Coaching Sessions
        </CardTitle>
        <Button 
          onClick={onUploadClick}
          size="sm"
          variant="outline"
          className="border-gray-300 hover:bg-gray-100 text-gray-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Recording
        </Button>
      </CardHeader>
      <CardContent className="p-0 bg-white">
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">
              No sessions yet
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
              Start your first coaching session with {clientName}.
            </p>
            <Button 
              onClick={onUploadClick}
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload First Recording
            </Button>
          </div>
        ) : (
          <div>
            {sessions.map(session => (
              <SessionCard 
                key={session.id} 
                session={session} 
                onDelete={onSessionDeleted}
              />
            ))}

            {sessions.length >= 10 && (
              <div className="p-4 text-center border-t border-gray-100 bg-gray-50">
                <Link href={`/sessions?client=${clientId}`}>
                  <Button
                    variant="outline"
                    className="border-gray-300 hover:bg-white text-gray-700"
                  >
                    View All Sessions
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}