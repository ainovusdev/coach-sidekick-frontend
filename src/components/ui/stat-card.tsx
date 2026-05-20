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
  /**
   * Variant controls only the icon-dot accent color now — never the
   * background. The DS forbids gradient surfaces.
   */
  variant?: 'blue' | 'green' | 'purple' | 'orange'
  className?: string
}

const ACCENT: Record<NonNullable<StatCardProps['variant']>, string> = {
  blue: 'text-ds-accent',
  green: 'text-forest',
  purple: 'text-indigo',
  orange: 'text-amber-token',
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  footer,
  variant = 'blue',
  className,
}: StatCardProps) {
  const accent = ACCENT[variant]

  return (
    <Card
      className={cn(
        'bg-surface-1 border border-line shadow-xs hover:shadow-sm transition-shadow duration-200',
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-3xl font-bold text-ink leading-tight tracking-tight">
              {value}
            </p>
            <p className="text-sm font-medium text-ink-3 mt-1">{title}</p>
            {subtitle && <p className="text-xs text-ink-4 mt-1">{subtitle}</p>}
          </div>
          <div
            className={cn(
              'shrink-0 w-9 h-9 rounded-md bg-surface-3 flex items-center justify-center',
              accent,
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </div>
        </div>
        {footer && (
          <div className="mt-4 flex items-center text-xs text-ink-3">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
