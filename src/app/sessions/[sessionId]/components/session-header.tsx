import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, ExternalLink, Activity, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { getStatusColor } from '../utils/session-utils'

interface SessionHeaderProps {
  session: {
    id: string
    status: string
    created_at: string
    meeting_url: string | null
    session_type?: string
  }
  onBack: () => void
  onDelete?: () => void
}

export default function SessionHeader({ session, onBack, onDelete }: SessionHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-gray-100 transition-colors -ml-2 sm:ml-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Session Details
              </h1>
              <Badge
                className={`${getStatusColor(
                  session.status,
                )} px-3 py-1 text-xs font-semibold shadow-sm`}
              >
                <Activity className="w-3 h-3 mr-1" />
                {session.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="ml-auto border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Session
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="font-medium">
                  {format(new Date(session.created_at), 'PPP')}
                </span>
              </div>
              {session.meeting_url && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5">
                  <ExternalLink className="h-4 w-4 text-gray-600" />
                  <span className="font-medium truncate max-w-xs">
                    {session.meeting_url.replace(/^https?:\/\//, '')}
                  </span>
                </div>
              )}
              {session.session_type === 'manual' && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5">
                  <span className="font-medium text-gray-600">
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