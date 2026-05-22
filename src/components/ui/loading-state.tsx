import { LoadingSpinner } from './loading-spinner'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Retained for backward compatibility — both modes now render the DS spinner. */
  variant?: 'default' | 'gradient'
}

export function LoadingState({
  message = 'Loading...',
  size = 'md',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn('flex items-center justify-center min-h-[60vh]', className)}
    >
      <div className="text-center">
        <LoadingSpinner size={size} className="mx-auto" />
        <p className="mt-3 text-ink-3 text-sm">{message}</p>
      </div>
    </div>
  )
}
