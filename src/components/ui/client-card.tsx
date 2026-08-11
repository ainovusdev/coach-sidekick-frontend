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
  dotClass: string
} {
  if (!lastSessionDate) {
    return { dotClass: 'bg-ink-4' }
  }
  const daysSince = Math.floor(
    (Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24),
  )
  if (daysSince <= 14) return { dotClass: 'bg-forest' }
  if (daysSince <= 30) return { dotClass: 'bg-amber-token' }
  return { dotClass: 'bg-vermillion' }
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

/**
 * Client roster card: name, initials avatar, email and a session-recency health dot.
 * Permission-aware (renders inside the app's PermissionProvider); can flag "my client"
 * and show the owning coach.
 *
 * @category patterns
 */
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
          'border border-line hover:border-line-strong hover:shadow-sm transition-all duration-200',
          onClick && !isViewer ? 'cursor-pointer' : 'cursor-default',
          className,
        )}
        onClick={isViewer ? undefined : onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <Avatar className="h-10 w-10 bg-ink border-2 border-line">
                <AvatarFallback className="bg-ink text-ink-on-dark text-sm font-bold">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-paper',
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
              <h3 className="font-semibold text-ink text-sm truncate">
                {name}
              </h3>
              {lastSessionDate ? (
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 text-ink-4 flex-shrink-0" />
                  <p className="text-xs text-ink-3">
                    {formatLastSession(lastSessionDate)}
                  </p>
                </div>
              ) : email ? (
                <p className="text-xs text-ink-3 truncate mt-1">{email}</p>
              ) : isMyClient === false && coachName ? (
                <p className="text-xs text-ink-3 mt-1">by {coachName}</p>
              ) : (
                <p className="text-xs text-ink-4 mt-1">No sessions yet</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </PermissionGate>
  )
}
