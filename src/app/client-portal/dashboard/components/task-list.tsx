'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Task } from '@/services/client-dashboard-api'
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  MessageSquare,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'

interface TaskListProps {
  tasks: Task[]
  onStatusUpdate: (taskId: string, status: Task['status']) => Promise<void>
  onTaskClick: (task: Task) => void
}

export function TaskList({
  tasks,
  onStatusUpdate,
  onTaskClick,
}: TaskListProps) {
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set())

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50'
      case 'high':
        return 'text-orange-600 bg-orange-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
      case 'pending':
        return <Circle className="h-5 w-5 text-gray-400" />
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const handleStatusChange = async (
    taskId: string,
    newStatus: Task['status'],
  ) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId))
    try {
      await onStatusUpdate(taskId, newStatus)
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const formatDueDate = (date: string | null) => {
    if (!date) return null
    const dueDate = new Date(date)
    const now = new Date()
    const diffDays = Math.floor(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diffDays < 0) {
      return (
        <span className="text-red-600">
          Overdue by {Math.abs(diffDays)} days
        </span>
      )
    } else if (diffDays === 0) {
      return <span className="text-orange-600">Due today</span>
    } else if (diffDays === 1) {
      return <span className="text-yellow-600">Due tomorrow</span>
    } else if (diffDays <= 7) {
      return <span className="text-blue-600">Due in {diffDays} days</span>
    } else {
      return (
        <span className="text-gray-600">
          Due {format(dueDate, 'MMM d, yyyy')}
        </span>
      )
    }
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center">
            No commitments assigned yet. Your coach will assign commitments
            during your sessions.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => {
        const isUpdating = updatingTasks.has(task.id)

        return (
          <Card
            key={task.id}
            className={`transition-all hover:shadow-md cursor-pointer ${
              task.status === 'completed' ? 'opacity-75' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="mt-1">{getStatusIcon(task.status)}</div>

                {/* Main Content */}
                <div
                  className="flex-1 space-y-2"
                  onClick={() => onTaskClick(task)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4
                        className={`font-medium ${
                          task.status === 'completed'
                            ? 'line-through text-gray-500'
                            : ''
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-gray-600">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <Badge
                      className={`ml-2 ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDueDate(task.due_date)}
                      </div>
                    )}
                    {task.comment_count !== undefined &&
                      task.comment_count > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {task.comment_count} comments
                        </div>
                      )}
                    {task.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        {task.tags.map(tag => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assignor Info */}
                  {task.assignor_name && (
                    <p className="text-xs text-gray-400">
                      Assigned by {task.assignor_name}
                    </p>
                  )}
                </div>

                {/* Status Selector */}
                <div onClick={e => e.stopPropagation()}>
                  <Select
                    value={task.status}
                    onValueChange={(value: Task['status']) =>
                      handleStatusChange(task.id, value)
                    }
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
