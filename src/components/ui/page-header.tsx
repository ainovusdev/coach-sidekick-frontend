import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconVariant?: 'default' | 'gradient'
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconVariant = 'default',
  actions,
  className
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {Icon && (
            <div className="flex items-center gap-3 mb-2">
              {iconVariant === 'gradient' ? (
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              ) : (
                <Icon className="h-6 w-6 text-neutral-600" />
              )}
              <h1 className={cn(
                'text-3xl',
                iconVariant === 'gradient' 
                  ? 'font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'
                  : 'font-semibold text-neutral-900'
              )}>
                {title}
              </h1>
            </div>
          )}
          {!Icon && (
            <h1 className="text-3xl font-semibold text-neutral-900">{title}</h1>
          )}
          {description && (
            <p className="text-neutral-500 mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">{actions}</div>
        )}
      </div>
    </div>
  )
}