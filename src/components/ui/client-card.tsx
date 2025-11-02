import { Card, CardContent } from './card'
import { Avatar, AvatarFallback } from './avatar'
import { FileText, Lock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions, PermissionGate } from '@/contexts/permission-context'

interface ClientCardProps {
  name: string
  notes?: string | null
  onClick?: () => void
  className?: string
  clientId?: string
  isMyClient?: boolean // NEW: Whether this client belongs to current user
  coachName?: string // NEW: Name of the coach who owns this client
}

export function ClientCard({
  name,
  notes,
  onClick,
  className,
  clientId: _clientId,
  isMyClient,
  coachName,
}: ClientCardProps) {
  const permissions = usePermissions()
  const isViewer = permissions.isViewer()
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <PermissionGate
      resource="clients"
      action="view"
      fallback={
        <Card
          className={cn(
            'border border-gray-200 bg-gray-50 opacity-60',
            className,
          )}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-gray-400 border border-gray-400">
                <AvatarFallback className="bg-gray-400 text-white text-sm font-bold">
                  <Lock className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-500 text-sm">
                  Restricted Access
                </p>
                <p className="text-xs text-gray-400">
                  Viewer permissions required
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      <Card
        className={cn(
          'border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all duration-200 group',
          onClick && !isViewer ? 'cursor-pointer' : 'cursor-default',
          isMyClient === false && 'border-blue-200 bg-blue-50/10', // Subtle blue tint for assigned clients
          className,
        )}
        onClick={isViewer ? undefined : onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar
                className={cn(
                  'h-10 w-10 border-2 transition-all group-hover:scale-105',
                  isMyClient === false
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400'
                    : 'bg-gray-900 border-gray-900',
                )}
              >
                <AvatarFallback
                  className={cn(
                    'text-sm font-bold',
                    isMyClient === false
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-gray-900 text-white',
                  )}
                >
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              {/* Ownership indicator dot */}
              {isMyClient === false && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"
                  title={`Assigned by ${coachName}`}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {name}
                </p>
              </div>
              {/* Ownership badge - more prominent */}
              {isMyClient === false && coachName && (
                <div className="flex items-center gap-1 mt-1">
                  <Users className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">
                    by {coachName}
                  </span>
                </div>
              )}
              {notes && !isViewer && isMyClient !== false && (
                <div className="flex items-center gap-1 mt-1">
                  <FileText className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-500 truncate">{notes}</p>
                </div>
              )}
              {notes && isViewer && (
                <div className="flex items-center gap-1 mt-1">
                  <Lock className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-400 italic">Notes hidden</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </PermissionGate>
  )
}
