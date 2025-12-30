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
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ClientCardProps {
  client: Client
  isAssigned?: boolean
  isViewer: boolean
  onView: () => void
  onEdit: () => void
  onInvite: () => void
}

export default function ClientCard({
  client,
  isAssigned = false,
  isViewer,
  onView,
  onEdit,
  onInvite,
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
    return date.toLocaleDateString()
  }

  return (
    <Card
      className="group border border-gray-200 bg-white rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
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
                    ? 'bg-blue-100 ring-2 ring-blue-200'
                    : 'bg-gray-100 ring-2 ring-gray-200'
                }`}
              >
                <AvatarFallback
                  className={`text-sm font-semibold ${
                    isAssigned ? 'text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              {isActive && (
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    isAssigned ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                />
              )}
            </div>

            {/* Name and Coach */}
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                {client.name}
              </h3>
              {isAssigned && client.coach_name && (
                <p className="text-xs text-blue-600 truncate">
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
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                  Invited
                </span>
              )}
              {client.invitation_status === 'accepted' && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
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
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
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
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <p className="text-sm text-gray-500 mt-3 line-clamp-2">
            {client.notes}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          {/* Sessions */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">
                {stats?.total_sessions || 0}
              </span>{' '}
              sessions
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-gray-200" />

          {/* Last Activity */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {formatLastSession(stats?.last_session_date)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
