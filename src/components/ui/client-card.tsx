import { Card, CardContent } from './card'
import { Avatar, AvatarFallback } from './avatar'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions, PermissionGate } from '@/contexts/permission-context'

interface ClientCardProps {
  name: string
  email?: string | null
  onClick?: () => void
  className?: string
  isMyClient?: boolean
  coachName?: string
  lastSessionDate?: string | null
}

function getHealthStatus(lastSessionDate?: string | null): {
  color: string
  dotClass: string
} {
  if (!lastSessionDate) {
    return { color: 'gray', dotClass: 'bg-gray-400' }
  }
  const daysSince = Math.floor(
    (Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24),
  )
  if (daysSince <= 14) {
    return { color: 'green', dotClass: 'bg-green-500' }
  }
  if (daysSince <= 30) {
    return { color: 'yellow', dotClass: 'bg-amber-500' }
  }
  return { color: 'red', dotClass: 'bg-red-500' }
}

function formatLastSession(dateStr: string): string {
  const daysSince = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  )
  if (daysSince === 0) return 'Today'
  if (daysSince === 1) return 'Yesterday'
  if (daysSince < 7) return `${daysSince}d ago`
  if (daysSince < 30) return `${Math.floor(daysSince / 7)}w ago`
  return `${Math.floor(daysSince / 30)}mo ago`
}

export function ClientCard({
  name,
  email,
  onClick,
  className,
  isMyClient,
  coachName,
  lastSessionDate,
}: ClientCardProps) {
  const permissions = usePermissions()
  const isViewer = permissions.isViewer()
  const health = getHealthStatus(lastSessionDate)

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
          'border border-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-500 hover:shadow-sm transition-all duration-200',
          onClick && !isViewer ? 'cursor-pointer' : 'cursor-default',
          className,
        )}
        onClick={isViewer ? undefined : onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <Avatar className="h-10 w-10 bg-gray-900 border-2 border-gray-200 dark:border-gray-700">
                <AvatarFallback className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900',
                  health.dotClass,
                )}
                title={
                  lastSessionDate
                    ? `Last session: ${formatLastSession(lastSessionDate)}`
                    : 'No sessions yet'
                }
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {name}
              </h3>
              {lastSessionDate ? (
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatLastSession(lastSessionDate)}
                  </p>
                </div>
              ) : email ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                  {email}
                </p>
              ) : isMyClient === false && coachName ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  by {coachName}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">No sessions yet</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </PermissionGate>
  )
}
