'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CommitmentService } from '@/services/commitment-service'
import { Commitment } from '@/types/commitment'
import {
  ArrowRight,
  Target,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, isPast, parseISO } from 'date-fns'

interface CommitmentsWidgetProps {
  clientId?: string
  limit?: number
  showHeader?: boolean
  viewAllLink?: string
  className?: string
}

export function CommitmentsWidget({
  clientId,
  limit = 5,
  showHeader = true,
  viewAllLink = '/client-portal/commitments',
  className,
}: CommitmentsWidgetProps) {
  const [loading, setLoading] = useState(true)
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCommitments()
  }, [clientId])

  const loadCommitments = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await CommitmentService.listCommitments({
        client_id: clientId,
        status: 'active',
        include_drafts: false,
      })
      // Sort by deadline and take top N
      const sorted = (response.commitments || [])
        .sort((a, b) => {
          if (!a.target_date && !b.target_date) return 0
          if (!a.target_date) return 1
          if (!b.target_date) return -1
          return (
            new Date(a.target_date).getTime() -
            new Date(b.target_date).getTime()
          )
        })
        .slice(0, limit)
      setCommitments(sorted)
    } catch (err) {
      console.error('Failed to load commitments:', err)
      setError('Failed to load commitments')
    } finally {
      setLoading(false)
    }
  }

  const getDeadlineStatus = (commitment: Commitment) => {
    if (!commitment.target_date) return null

    const targetDate = parseISO(commitment.target_date)
    const isOverdue = isPast(targetDate)

    if (isOverdue) {
      return {
        text: 'Overdue',
        className: 'text-red-600',
      }
    }

    return {
      text: `Due ${formatDistanceToNow(targetDate, { addSuffix: true })}`,
      className: 'text-zinc-400',
    }
  }

  if (loading) {
    return (
      <Card className={cn('bg-zinc-900 border-zinc-800', className)}>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-zinc-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('bg-zinc-900 border-zinc-800', className)}>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="size-8 mx-auto mb-2 text-red-600" />
            <p className="text-zinc-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCommitments}
              className="mt-4 border-zinc-700 text-zinc-300"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('bg-zinc-900 border-zinc-800', className)}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="size-5" />
              My Active Commitments
            </CardTitle>
            <Link href={viewAllLink}>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
      )}

      <CardContent>
        {commitments.length === 0 ? (
          <div className="text-center py-8">
            <Target className="size-12 mx-auto mb-3 text-zinc-700" />
            <p className="text-zinc-500">No active commitments</p>
            <p className="text-sm text-zinc-600 mt-1">
              Commitments from your coaching sessions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {commitments.map(commitment => {
              const deadlineStatus = getDeadlineStatus(commitment)
              return (
                <div
                  key={commitment.id}
                  className="p-4 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-white flex-1">
                        {commitment.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                      >
                        {commitment.type}
                      </Badge>
                    </div>

                    {commitment.description && (
                      <p className="text-sm text-zinc-400 line-clamp-2">
                        {commitment.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Progress</span>
                        <span className="text-white font-medium">
                          {commitment.progress_percentage}%
                        </span>
                      </div>
                      <Progress
                        value={commitment.progress_percentage}
                        className="h-2 bg-zinc-800"
                      />
                    </div>

                    {/* Deadline */}
                    {deadlineStatus && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className={deadlineStatus.className}>
                          {deadlineStatus.text}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            <Link href={viewAllLink}>
              <Button className="w-full bg-white text-black hover:bg-zinc-200 mt-2">
                <TrendingUp className="size-4 mr-2" />
                Update Progress
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
