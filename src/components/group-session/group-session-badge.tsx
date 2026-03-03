'use client'

import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface GroupSessionBadgeProps {
  count?: number
  className?: string
}

export function GroupSessionBadge({
  count,
  className = '',
}: GroupSessionBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800 text-xs ${className}`}
    >
      <Users className="h-3 w-3 mr-1" />
      {count != null ? `${count} participants` : 'Group'}
    </Badge>
  )
}
