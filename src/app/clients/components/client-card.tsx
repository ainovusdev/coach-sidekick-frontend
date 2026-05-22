'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Client } from '@/types/meeting'
import {
  Eye,
  Edit,
  Send,
  Calendar,
  Clock,
  UserCheck,
  MoreHorizontal,
  XCircle,
  Trash2,
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ClientCardProps {
  client: Client
  isAssigned?: boolean
  isViewer: boolean
  onView: () => void
  onEdit: () => void
  onInvite: () => void
  onCancelInvite?: () => void
  onDelete: () => void
}

export default function ClientCard({
  client,
  isAssigned = false,
  isViewer,
  onView,
  onEdit,
  onInvite,
  onCancelInvite,
  onDelete,
}: ClientCardProps) {
  const stats = client.client_session_stats?.[0]

  // Calculate if client is active (session in last 7 days)
  const isActive = (() => {
    if (!stats?.last_session_date) return false
    const daysDiff = Math.ceil(
      (Date.now() - new Date(stats.last_session_date).getTime()) /
        (1000 * 60 * 60 * 24),
    )
    return daysDiff <= 7
  })()

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Format last session date
  const formatLastSession = (dateString?: string) => {
    if (!dateString) return 'No sessions yet'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays} days ago`
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return formatDate(dateString)
  }

  return (
    <Card
      className="group border border-line bg-surface-1 rounded-xl hover:border-line-strong hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onView}
    >
      <CardContent className="p-5">
        {/* Header: Avatar, Name, Badges, Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar
                className={`h-11 w-11 ${
                  isAssigned
                    ? 'bg-ds-accent-bg ring-2 ring-ds-accent'
                    : 'bg-surface-3 ring-2 ring-line'
                }`}
              >
                <AvatarFallback
                  className={`text-sm font-semibold ${
                    isAssigned ? 'text-ds-accent' : 'text-ink-2'
                  }`}
                >
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              {isActive && (
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-paper ${
                    isAssigned ? 'bg-ds-accent' : 'bg-forest'
                  }`}
                />
              )}
            </div>

            {/* Name and Coach */}
            <div className="min-w-0">
              <h3 className="font-semibold text-ink truncate group-hover:text-ink-2 transition-colors">
                {client.name}
              </h3>
              {isAssigned && client.coach_name && (
                <p className="text-xs text-ds-accent truncate">
                  Coach: {client.coach_name}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Status Badges */}
            <div className="flex items-center gap-1.5 mr-1">
              {client.invitation_status === 'invited' && (
                <span className="px-2 py-0.5 text-xs font-medium bg-indigo-bg text-indigo rounded-full">
                  Invited
                </span>
              )}
              {client.invitation_status === 'accepted' && (
                <span className="px-2 py-0.5 text-xs font-medium bg-forest-bg text-forest rounded-full flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Portal
                </span>
              )}
            </div>

            {/* Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={e => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-ink-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation()
                    onView()
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {!isViewer && (
                  <>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation()
                        onEdit()
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Client
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation()
                        onInvite()
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Invite
                    </DropdownMenuItem>
                    {client.invitation_status === 'invited' &&
                      onCancelInvite && (
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            onCancelInvite()
                          }}
                          className="text-vermillion focus:text-vermillion focus:bg-vermillion-bg "
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Invitation
                        </DropdownMenuItem>
                      )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation()
                        onDelete()
                      }}
                      className="text-vermillion focus:text-vermillion focus:bg-vermillion-bg "
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Client
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <p className="text-sm text-ink-3 mt-3 line-clamp-2">{client.notes}</p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-line">
          {/* Sessions */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-ink-4" />
            <span className="text-sm text-ink-3">
              <span className="font-medium text-ink">
                {stats?.total_sessions || 0}
              </span>{' '}
              sessions
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-surface-3" />

          {/* Last Activity */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-ink-4" />
            <span className="text-sm text-ink-3">
              {formatLastSession(stats?.last_session_date)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
