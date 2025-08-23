import { LoadingSpinner } from './loading-spinner'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  variant?: 'default' | 'gradient'
}

export function LoadingState({ 
  message = 'Loading...', 
  size = 'md', 
  className,
  variant = 'default' 
}: LoadingStateProps) {
  if (variant === 'gradient') {
    return (
      <div className={cn('flex items-center justify-center min-h-[60vh]', className)}>
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
            <div className="absolute inset-2 animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 animation-delay-150"></div>
            <div className="absolute inset-4 animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600 animation-delay-300"></div>
          </div>
          <p className="text-gray-600 font-medium animate-pulse">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center min-h-[60vh]', className)}>
      <div className="text-center">
        <LoadingSpinner size={size} className="mx-auto" />
        <p className="mt-3 text-neutral-600 text-sm">{message}</p>
      </div>
    </div>
  )
}