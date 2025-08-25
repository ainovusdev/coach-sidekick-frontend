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

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  iconClassName
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className={cn(
        'mx-auto w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3',
        iconClassName
      )}>
        <Icon className="h-6 w-6 text-neutral-400" />
      </div>
      <h3 className="text-sm font-medium text-neutral-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-600 mb-4 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-3">
          {action && (
            <Button 
              onClick={action.onClick}
              className="bg-neutral-900 hover:bg-neutral-800 text-white"
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'outline'}
              onClick={secondaryAction.onClick}
              className="border-neutral-300 hover:bg-neutral-50 text-neutral-700"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}