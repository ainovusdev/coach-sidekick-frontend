import { useRouter } from 'next/navigation'
import { Card, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { SessionCardCompact } from './session-card-compact'
import { MessageSquare, Plus, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionsTabProps {
  sessions: any[] | null
  client: any
  isViewer: boolean
  onAddSession: () => void
  onRefresh?: () => void
}

export function SessionsTab({
  sessions,
  client,
  isViewer,
  onAddSession,
  onRefresh,
}: SessionsTabProps) {
  const router = useRouter()

  return (
    <Card className="border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden h-full flex flex-col">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            Coaching Sessions
          </h2>
          {!isViewer && (
            <Button size="sm" onClick={onAddSession}>
              <Plus className="h-4 w-4 mr-1" />
              Add Past Session
            </Button>
          )}
        </div>
      </CardHeader>
      <ScrollArea className="flex-1">
        {sessions && sessions.length > 0 ? (
          <div>
            {sessions.map((session, index) => (
              <div
                key={session.id}
                className={cn(
                  'p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer',
                  index !== 0 &&
                    'border-t border-gray-100 dark:border-gray-700',
                )}
                onClick={() => router.push(`/sessions/${session.id}`)}
              >
                <SessionCardCompact
                  session={session}
                  showClient={false}
                  showReanalyze={!isViewer}
                  onReanalyzeComplete={onRefresh}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-gray-900 dark:text-white font-medium mb-2">
                No sessions yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                {isViewer
                  ? `No sessions have been recorded for ${client.name} yet.`
                  : `Start recording your first coaching session with ${client.name}`}
              </p>
              {!isViewer && (
                <Button
                  onClick={onAddSession}
                  className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Recording
                </Button>
              )}
            </div>
          </div>
        )}
      </ScrollArea>
    </Card>
  )
}
