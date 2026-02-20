'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface NextSessionCardProps {
  nextSession: string | null
}

export function NextSessionCard({ nextSession }: NextSessionCardProps) {
  if (!nextSession) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Next Session</p>
              <p className="text-xs text-gray-500">
                No upcoming session scheduled
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sessionDate = new Date(nextSession)
  const relativeTime = formatDistanceToNow(sessionDate, { addSuffix: true })

  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Next Session</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-700 font-medium">
                  {format(sessionDate, 'EEEE, MMM d')}
                </p>
                <span className="text-xs text-gray-400">·</span>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(sessionDate, 'h:mm a')}
                </p>
              </div>
              <p className="text-xs text-blue-600 mt-0.5">{relativeTime}</p>
            </div>
          </div>
          <Link href="/client-portal/sessions">
            <Button variant="ghost" size="sm" className="text-xs">
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
