import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SessionTitleEditor } from '@/components/sessions/session-title-editor'
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Activity,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import { getStatusColor } from '../utils/session-utils'

interface SessionHeaderProps {
  session: {
    id: string
    status: string
    created_at: string
    meeting_url: string | null
    session_type?: string
    title?: string | null
  }
  onBack: () => void
  onDelete?: () => void
  onTitleUpdate?: (newTitle: string) => void
}

export default function SessionHeader({
  session,
  onBack,
  onDelete,
  onTitleUpdate,
}: SessionHeaderProps) {
  const defaultTitle = `Session - ${format(new Date(session.created_at), 'PPP')}`

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-gray-50 transition-colors -ml-2 sm:ml-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
              <SessionTitleEditor
                sessionId={session.id}
                initialTitle={session.title}
                defaultTitle={defaultTitle}
                onTitleUpdated={onTitleUpdate}
              />
              <Badge
                className={`${getStatusColor(
                  session.status,
                )} px-3 py-1 text-xs font-semibold`}
              >
                <Activity className="w-3 h-3 mr-1" />
                {session.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="ml-auto border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-black"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Session
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-1.5 border border-gray-100">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-700">
                  {format(new Date(session.created_at), 'PPP')}
                </span>
              </div>
              {session.meeting_url && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-1.5 border border-gray-100">
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-700 truncate max-w-xs">
                    {session.meeting_url.replace(/^https?:\/\//, '')}
                  </span>
                </div>
              )}
              {session.session_type === 'manual' && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-1.5 border border-gray-100">
                  <span className="font-medium text-gray-700">
                    Manual Upload Session
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
