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
      className={`bg-forest-bg text-forest border-forest text-xs ${className}`}
    >
      <Users className="h-3 w-3 mr-1" />
      {count != null ? `${count} participants` : 'Group'}
    </Badge>
  )
}
