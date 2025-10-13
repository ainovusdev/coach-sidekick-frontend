import { Card, CardContent } from './card'
import { Avatar, AvatarFallback } from './avatar'
import { Badge } from './badge'
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
          'border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all duration-200',
          onClick && !isViewer ? 'cursor-pointer' : 'cursor-default',
          className,
        )}
        onClick={isViewer ? undefined : onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-gray-900 border border-gray-900">
              <AvatarFallback className="bg-gray-900 text-white text-sm font-bold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 text-sm">{name}</p>
                {/* NEW: Ownership indicator badge */}
                {isMyClient === false && coachName && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 border-blue-300 text-blue-700 text-xs"
                  >
                    <Users className="h-2.5 w-2.5 mr-1" />
                    {coachName}
                  </Badge>
                )}
              </div>
              {notes && !isViewer && (
                <div className="flex items-center gap-1 mt-0.5">
                  <FileText className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-500 truncate">{notes}</p>
                </div>
              )}
              {notes && isViewer && (
                <div className="flex items-center gap-1 mt-0.5">
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
