import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { SessionCardCompact } from './session-card-compact'
import { MessageSquare, Plus, Upload, Lock, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ClientChatUnified } from './client-chat-unified'

interface SessionsTabProps {
  sessions: any[] | null
  client: any
  isViewer: boolean
  onAddSession: () => void
}

export function SessionsTab({
  sessions,
  client,
  isViewer,
  onAddSession,
}: SessionsTabProps) {
  const router = useRouter()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sessions List - Left Side */}
      <div>
        <Card className="border-gray-200 shadow-sm overflow-hidden pt-2">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-600" />
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
          <ScrollArea className="h-[600px]">
            {sessions && sessions.length > 0 ? (
              <div>
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className={cn(
                      'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
                      index !== 0 && 'border-t border-gray-100',
                    )}
                    onClick={() => router.push(`/sessions/${session.id}`)}
                  >
                    <SessionCardCompact session={session} showClient={false} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-gray-900 font-medium mb-2">
                    No sessions yet
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {isViewer
                      ? `No sessions have been recorded for ${client.name} yet.`
                      : `Start recording your first coaching session with ${client.name}`}
                  </p>
                  {!isViewer && (
                    <Button
                      onClick={onAddSession}
                      className="bg-gray-900 hover:bg-gray-800 text-white"
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
      </div>

      {/* Unified Chat Widget - Hidden for viewers */}
      {!isViewer ? (
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardContent className="p-0 h-full -my-4">
            <ClientChatUnified clientId={client.id} clientName={client.name} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 bg-blue-50 rounded-full mb-4">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Restricted Access
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Chat functionality is not available with viewer permissions.
              </p>
              <Badge
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700"
              >
                <Eye className="h-3 w-3 mr-1.5" />
                View Only Mode
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
