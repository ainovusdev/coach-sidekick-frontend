import { LucideIcon } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: 'outline' | 'ghost'
  }
  className?: string
  iconClassName?: string
}

/**
 * Centered empty-state block with icon, title, description and optional primary and
 * secondary actions.
 *
 * @category feedback
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  iconClassName,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div
        className={cn(
          'mx-auto w-12 h-12 bg-surface-3 rounded-full flex items-center justify-center mb-3',
          iconClassName,
        )}
      >
        <Icon className="h-6 w-6 text-ink-3" strokeWidth={1.75} />
      </div>
      <h3 className="text-sm font-medium text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-ink-3 mb-4 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'outline'}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
