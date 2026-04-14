'use client'

import { useState } from 'react'
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
  Users,
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
// getStatusColor removed - using minimal dot indicator instead

interface SessionHeaderProps {
  session: {
    id: string
    status: string
    created_at: string
    started_at?: string | null
    meeting_url: string | null
    session_type?: string
    title?: string | null
    summary?: string | null
    coach_notes?: string | null
    client_id?: string | null
    is_group_session?: boolean
    participant_client_ids?: string[]
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
  const sessionDate = session.started_at || session.created_at
  const defaultTitle = `Session - ${formatDate(sessionDate)}`

  const hasActions = onDelete || onSendEmail || onDownloadTranscript

  return (
    <>
      <div className="bg-app-background border-b border-app-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Single row: back + title + meta + actions */}
          <div className="flex items-center gap-3">
            {/* Back button */}
            <button
              onClick={onBack}
              className="text-app-secondary hover:text-app-primary transition-colors shrink-0 -ml-1 p-1 rounded-md hover:bg-app-surface"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {/* Separator */}
            <div className="w-px h-5 bg-app-border shrink-0" />

            {/* Title (editable) */}
            <div className="flex-1 min-w-0">
              <SessionTitleEditor
                sessionId={session.id}
                initialTitle={session.title}
                defaultTitle={defaultTitle}
                onTitleUpdated={onTitleUpdate}
              />
            </div>

            {/* Right side: metadata + badges + actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Metadata - hidden on small screens */}
              <div className="hidden md:flex items-center gap-2 text-sm text-app-secondary">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(sessionDate, 'PPP · h:mm a')}</span>
                </div>

                {session.meeting_url && (
                  <>
                    <span className="text-app-border">·</span>
                    <a
                      href={session.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-app-primary transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate max-w-[140px]">
                        {
                          session.meeting_url
                            .replace(/^https?:\/\//, '')
                            .split('/')[0]
                        }
                      </span>
                    </a>
                  </>
                )}

                {session.session_type === 'manual' && (
                  <>
                    <span className="text-app-border">·</span>
                    <span>Manual</span>
                  </>
                )}
              </div>

              {/* Status dot */}
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${getStatusDot(session.status)}`}
                title={session.status.replace('_', ' ')}
              />

              {/* Group badge */}
              {session.is_group_session && (
                <Badge className="bg-purple-50 text-purple-700 border-purple-200 px-2 py-0.5 text-xs font-medium flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {session.participant_client_ids?.length || 0}
                </Badge>
              )}

              {/* Actions dropdown */}
              {hasActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-md text-app-secondary hover:text-app-primary hover:bg-app-surface transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
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
          </div>

          {/* Mobile metadata - shown below on small screens */}
          <div className="flex md:hidden items-center gap-2 mt-2 ml-8 text-xs text-app-secondary">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(sessionDate, 'PPP · h:mm a')}</span>
            {session.session_type === 'manual' && (
              <>
                <span className="text-app-border">·</span>
                <span>Manual</span>
              </>
            )}
          </div>
        </div>
      </div>

      <EditSessionModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        session={session}
      />
    </>
  )
}
