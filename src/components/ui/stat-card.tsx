import { ReactNode } from 'react'
import { Card, CardContent } from './card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  footer?: ReactNode
  variant?: 'blue' | 'green' | 'purple' | 'orange'
  className?: string
}

const variantStyles = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
    icon: 'bg-blue-500',
    text: 'text-blue-900',
    subtitle: 'text-blue-600',
    footer: 'text-blue-600'
  },
  green: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200',
    icon: 'bg-green-500',
    text: 'text-green-900',
    subtitle: 'text-green-600',
    footer: 'text-green-600'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200',
    icon: 'bg-purple-500',
    text: 'text-purple-900',
    subtitle: 'text-purple-600',
    footer: 'text-purple-600'
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200',
    icon: 'bg-orange-500',
    text: 'text-orange-900',
    subtitle: 'text-orange-600',
    footer: 'text-orange-600'
  }
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  footer,
  variant = 'blue',
  className
}: StatCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card className={cn(
      styles.bg,
      'shadow-sm hover:shadow-md transition-all duration-200',
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('text-3xl font-bold', styles.text)}>
              {value}
            </p>
            <p className={cn('text-sm font-medium', styles.subtitle)}>
              {title}
            </p>
            {subtitle && (
              <p className={cn('text-xs mt-1', styles.subtitle)}>
                {subtitle}
              </p>
            )}
          </div>
          <div className={cn('p-4 rounded-2xl shadow-lg', styles.icon)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {footer && (
          <div className={cn('mt-4 flex items-center text-xs', styles.footer)}>
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  )
}