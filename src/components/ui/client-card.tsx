import { Card, CardContent } from './card'
import { Avatar, AvatarFallback } from './avatar'
import { Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions, PermissionGate } from '@/contexts/permission-context'

interface ClientCardProps {
  name: string
  email?: string | null
  onClick?: () => void
  className?: string
  isMyClient?: boolean
  coachName?: string
}

export function ClientCard({
  name,
  email,
  onClick,
  className,
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
    <PermissionGate resource="clients" action="view" fallback={null}>
      <Card
        className={cn(
          'border border-gray-200 hover:border-gray-900 hover:shadow-sm transition-all duration-200',
          onClick && !isViewer ? 'cursor-pointer' : 'cursor-default',
          className,
        )}
        onClick={isViewer ? undefined : onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-gray-900 border-2 border-gray-200 flex-shrink-0">
              <AvatarFallback className="bg-gray-900 text-white text-sm font-bold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {name}
              </h3>
              {email && (
                <div className="flex items-center gap-1 mt-1">
                  <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500 truncate">{email}</p>
                </div>
              )}
              {!email && isMyClient === false && coachName && (
                <p className="text-xs text-gray-500 mt-1">by {coachName}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </PermissionGate>
  )
}
