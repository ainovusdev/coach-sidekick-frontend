'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { SprintService } from '@/services/sprint-service'
import { SprintStatus } from '@/types/sprint'
import { MoreVertical, CheckCircle, Play, X, Edit } from 'lucide-react'
import { toast } from 'sonner'

interface SprintStatusMenuProps {
  sprintId: string
  currentStatus: SprintStatus
  onStatusChanged?: () => void
}

export function SprintStatusMenu({
  sprintId,
  currentStatus,
  onStatusChanged,
}: SprintStatusMenuProps) {
  const [updating, setUpdating] = useState(false)

  const handleStatusChange = async (newStatus: SprintStatus) => {
    setUpdating(true)
    try {
      await SprintService.updateSprint(sprintId, { status: newStatus })

      const statusMessages: Record<SprintStatus, string> = {
        planning: 'Sprint moved to planning',
        active: 'Sprint activated',
        completed: 'Sprint marked as complete',
        cancelled: 'Sprint cancelled',
      }

      toast.success('Status Updated', {
        description: statusMessages[newStatus],
      })

      onStatusChanged?.()
    } catch (error) {
      console.error('Failed to update sprint status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const statusOptions = [
    {
      value: 'planning' as SprintStatus,
      label: 'Planning',
      icon: Edit,
      color: 'text-amber-token',
    },
    {
      value: 'active' as SprintStatus,
      label: 'Active',
      icon: Play,
      color: 'text-forest',
    },
    {
      value: 'completed' as SprintStatus,
      label: 'Completed',
      icon: CheckCircle,
      color: 'text-ds-accent',
    },
    {
      value: 'cancelled' as SprintStatus,
      label: 'Cancelled',
      icon: X,
      color: 'text-ink-3',
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={updating}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {statusOptions.map(option => {
          const Icon = option.icon
          const isCurrent = option.value === currentStatus

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => !isCurrent && handleStatusChange(option.value)}
              disabled={isCurrent || updating}
              className={isCurrent ? 'bg-paper' : ''}
            >
              <Icon className={`h-4 w-4 mr-2 ${option.color}`} />
              <span>{option.label}</span>
              {isCurrent && (
                <span className="ml-auto text-xs text-ink-3">(Current)</span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
