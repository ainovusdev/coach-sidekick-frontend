'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SessionTitleEditor } from '@/components/sessions/session-title-editor'
import { EditSessionModal } from '@/components/sessions/edit-session-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Trash2,
  Mail,
  Loader2,
  Pencil,
  Download,
  MoreHorizontal,
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import { getStatusColor } from '../utils/session-utils'

interface SessionHeaderProps {
  session: {
    id: string
    status: string
    created_at: string
    meeting_url: string | null
    session_type?: string
    title?: string | null
    summary?: string | null
    client_id?: string | null
  }
  onBack: () => void
  onDelete?: () => void
  onTitleUpdate?: (newTitle: string) => void
  onSendEmail?: () => void
  sendingEmail?: boolean
  onDownloadTranscript?: () => void
}

function getStatusDot(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-500'
    case 'in_progress':
    case 'active':
      return 'bg-black animate-pulse'
    case 'pending_upload':
      return 'bg-amber-500'
    case 'processing':
      return 'bg-gray-400 animate-pulse'
    case 'failed':
      return 'bg-red-500'
    default:
      return 'bg-gray-400'
  }
}

export default function SessionHeader({
  session,
  onBack,
  onDelete,
  onTitleUpdate,
  onSendEmail,
  sendingEmail = false,
  onDownloadTranscript,
}: SessionHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const defaultTitle = `Session - ${formatDate(session.created_at)}`

  const hasActions = onDelete || onSendEmail || onDownloadTranscript

  return (
    <>
      <div className="bg-app-background border-b border-app-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Top row: Back button and actions */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-app-secondary hover:text-app-primary hover:bg-app-surface -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {/* Actions dropdown */}
            {hasActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-app-border hover:bg-app-surface"
                  >
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onDelete && (
                    <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Session
                    </DropdownMenuItem>
                  )}
                  {onSendEmail && (
                    <DropdownMenuItem
                      onClick={onSendEmail}
                      disabled={sendingEmail}
                    >
                      {sendingEmail ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      {sendingEmail ? 'Sending...' : 'Send Summary'}
                    </DropdownMenuItem>
                  )}
                  {onDownloadTranscript && (
                    <DropdownMenuItem onClick={onDownloadTranscript}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Transcript
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={onDelete}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Session
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Main header content */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <SessionTitleEditor
                  sessionId={session.id}
                  initialTitle={session.title}
                  defaultTitle={defaultTitle}
                  onTitleUpdated={onTitleUpdate}
                />

                {/* Status badge with dot indicator */}
                <Badge
                  className={`${getStatusColor(session.status)} px-3 py-1 text-xs font-medium flex items-center gap-2`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${getStatusDot(session.status)}`}
                  />
                  {session.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-app-secondary">
                <div className="flex items-center gap-2 bg-app-surface rounded-lg px-3 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-app-secondary" />
                  <span>{formatDate(session.created_at, 'PPP · h:mm a')}</span>
                </div>

                {session.meeting_url && (
                  <a
                    href={session.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-app-surface rounded-lg px-3 py-1.5 hover:bg-app-border/50 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-app-secondary" />
                    <span className="truncate max-w-[180px]">
                      {
                        session.meeting_url
                          .replace(/^https?:\/\//, '')
                          .split('/')[0]
                      }
                    </span>
                  </a>
                )}

                {session.session_type === 'manual' && (
                  <span className="bg-app-surface rounded-lg px-3 py-1.5 text-app-secondary">
                    Manual Upload
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditSessionModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        session={session}
        onSuccess={() => {
          if (onTitleUpdate && session.title) {
            onTitleUpdate(session.title)
          }
        }}
      />
    </>
  )
}
