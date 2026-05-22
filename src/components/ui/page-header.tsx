import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  /**
   * Retained for backward compatibility — both values now render the same
   * DS-aligned header. The DS forbids decorative gradients.
   */
  iconVariant?: 'default' | 'gradient'
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {Icon ? (
            <div className="flex items-center gap-3 mb-2">
              <Icon className="h-6 w-6 text-ink-3" strokeWidth={1.75} />
              <h1 className="text-3xl font-semibold text-ink">{title}</h1>
            </div>
          ) : (
            <h1 className="text-3xl font-semibold text-ink">{title}</h1>
          )}
          {description && <p className="text-ink-3 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
}
