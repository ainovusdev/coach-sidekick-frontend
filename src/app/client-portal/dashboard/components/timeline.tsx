'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TimelineItem } from '@/services/client-dashboard-api'
import { Calendar, CheckCircle2, Trophy, Clock, Video } from 'lucide-react'
import { format } from 'date-fns'

interface TimelineProps {
  items: TimelineItem[]
}

export function Timeline({ items }: TimelineProps) {
  const getItemIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'session':
        return <Video className="h-4 w-4 text-blue-600" />
      case 'task_completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'goal_achieved':
        return <Trophy className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getItemColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'session':
        return 'border-blue-200 bg-blue-50'
      case 'task_completed':
        return 'border-green-200 bg-green-50'
      case 'goal_achieved':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return format(date, 'MMM d, yyyy')
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Your activity timeline will appear here as you complete sessions
              and tasks.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group items by date
  const groupedItems = items.reduce(
    (acc, item) => {
      const date = item.date
        ? format(new Date(item.date), 'yyyy-MM-dd')
        : 'unknown'
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(item)
      return acc
    },
    {} as Record<string, TimelineItem[]>,
  )

  const sortedDates = Object.keys(groupedItems).sort((a, b) =>
    b.localeCompare(a),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <Badge variant="secondary">{items.length} activities</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Timeline items */}
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date} className="space-y-3">
                {/* Date header */}
                <div className="flex items-center gap-3">
                  <div className="relative z-10 bg-white px-2">
                    <Badge variant="outline" className="bg-white">
                      {formatDate(groupedItems[date][0].date)}
                    </Badge>
                  </div>
                </div>

                {/* Items for this date */}
                {groupedItems[date].map((item, idx) => (
                  <div key={`${date}-${idx}`} className="flex gap-4 ml-2">
                    {/* Icon */}
                    <div
                      className={`relative z-10 p-2 rounded-full border-2 bg-white ${getItemColor(item.type)}`}
                    >
                      {getItemIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div
                        className={`p-3 rounded-lg border ${getItemColor(item.type)}`}
                      >
                        <h4 className="font-medium text-sm mb-1">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-gray-600">
                            {item.description}
                          </p>
                        )}

                        {/* Additional data based on type */}
                        {item.type === 'session' && item.data && (
                          <div className="mt-2 space-y-1">
                            {item.data.duration_minutes && (
                              <p className="text-xs text-gray-500">
                                Duration: {item.data.duration_minutes} minutes
                              </p>
                            )}
                            {item.data.key_topics &&
                              item.data.key_topics.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.data.key_topics
                                    .slice(0, 3)
                                    .map((topic: string, i: number) => (
                                      <Badge
                                        key={i}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {topic}
                                      </Badge>
                                    ))}
                                </div>
                              )}
                          </div>
                        )}

                        {item.type === 'task_completed' && item.data && (
                          <div className="mt-2">
                            {item.data.priority && (
                              <Badge variant="outline" className="text-xs">
                                {item.data.priority} priority
                              </Badge>
                            )}
                          </div>
                        )}

                        {item.type === 'goal_achieved' && item.data && (
                          <div className="mt-2">
                            {item.data.category && (
                              <Badge variant="secondary" className="text-xs">
                                {item.data.category}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(item.date), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
