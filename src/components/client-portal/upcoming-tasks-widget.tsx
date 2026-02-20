'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, ArrowRight, AlertCircle } from 'lucide-react'
import { formatDistanceToNow, isPast } from 'date-fns'
import type { Task } from '@/services/client-dashboard-api'

interface UpcomingTasksWidgetProps {
  tasks: Task[]
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
}

export function UpcomingTasksWidget({ tasks }: UpcomingTasksWidgetProps) {
  const sortedTasks = [...tasks]
    .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
    .sort((a, b) => {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    })
    .slice(0, 5)

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-gray-600" />
            Upcoming Tasks
          </CardTitle>
          <Link href="/client-portal/sessions">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {sortedTasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No pending tasks
          </p>
        ) : (
          <div className="space-y-2.5">
            {sortedTasks.map(task => {
              const isOverdue = task.due_date && isPast(new Date(task.due_date))
              return (
                <div key={task.id} className="flex items-start gap-2.5 py-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 h-4 ${priorityColors[task.priority] || priorityColors.low}`}
                      >
                        {task.priority}
                      </Badge>
                      {task.due_date && (
                        <span
                          className={`text-xs flex items-center gap-1 ${
                            isOverdue
                              ? 'text-red-600 font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          {isOverdue && <AlertCircle className="h-3 w-3" />}
                          {isOverdue
                            ? 'Overdue'
                            : formatDistanceToNow(new Date(task.due_date), {
                                addSuffix: true,
                              })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
