import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Circular border spinner. Sizes: sm, md, lg.
 *
 * @category feedback
 */
export function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-2',
    lg: 'h-16 w-16 border-4',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-ink border-t-transparent',
        sizeClasses[size],
        className,
      )}
    />
  )
}
