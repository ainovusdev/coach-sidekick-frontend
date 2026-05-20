'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'

interface NextSessionCardProps {
  nextSession: string | null
}

export function NextSessionCard({ nextSession }: NextSessionCardProps) {
  if (!nextSession) {
    return (
      <Card className="border-line">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-3 ">
              <Calendar className="h-4 w-4 text-ink-4 " />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink ">Next Session</p>
              <p className="text-xs text-ink-3 ">
                No upcoming session scheduled
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const relativeTime = formatRelativeTime(nextSession)

  return (
    <Card className="border-line">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ds-accent-bg ">
              <Calendar className="h-4 w-4 text-ds-accent " />
            </div>
            <div>
              <p className="text-sm font-medium text-ink ">Next Session</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-ink-2 font-medium">
                  {formatDate(nextSession, 'EEEE, MMM d')}
                </p>
                <span className="text-xs text-ink-4 ">·</span>
                <p className="text-xs text-ink-3 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(nextSession, 'h:mm a')}
                </p>
              </div>
              <p className="text-xs text-ds-accent mt-0.5">{relativeTime}</p>
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
