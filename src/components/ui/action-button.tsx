import { Button } from './button'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionButtonProps {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  className?: string
  iconPosition?: 'left' | 'right'
}

export function ActionButton({
  label,
  icon: Icon,
  onClick,
  variant = 'outline',
  size = 'default',
  fullWidth = false,
  loading = false,
  disabled = false,
  className,
  iconPosition = 'left'
}: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        fullWidth && 'w-full',
        variant === 'outline' && 'border-neutral-200 hover:bg-neutral-50 text-neutral-700',
        className
      )}
    >
      {iconPosition === 'left' && (
        <Icon className={cn(
          'h-4 w-4',
          label && 'mr-2',
          loading && 'animate-spin'
        )} />
      )}
      {label}
      {iconPosition === 'right' && (
        <Icon className={cn(
          'h-4 w-4',
          label && 'ml-2',
          loading && 'animate-spin'
        )} />
      )}
    </Button>
  )
}