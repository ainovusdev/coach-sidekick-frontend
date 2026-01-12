'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Calendar, TrendingUp } from 'lucide-react'
import { CommitmentService } from '@/services/commitment-service'
import { Commitment } from '@/types/commitment'
import { format, isPast } from 'date-fns'

interface RecentCommitmentsCardProps {
  clientId: string
  compact?: boolean
}

export function RecentCommitmentsCard({
  clientId,
  compact: _compact = false,
}: RecentCommitmentsCardProps) {
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCommitments = async (showLoading = false) => {
      try {
        if (showLoading) setLoading(true)
        const response = await CommitmentService.listCommitments({
          client_id: clientId,
          status: 'active',
        })
        // Get the most recent 5 active commitments
        setCommitments(response.commitments.slice(0, 5))
      } catch (error) {
        console.error('Failed to fetch commitments:', error)
      } finally {
        if (showLoading) setLoading(false)
      }
    }

    if (clientId) {
      // Initial fetch with loading state
      fetchCommitments(true)

      // Poll every 30 seconds for updates (client may add commitments)
      const interval = setInterval(() => fetchCommitments(false), 30000)

      return () => clearInterval(interval)
    }
  }, [clientId])

  if (loading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
        <CardHeader className="pb-3 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Target className="h-4 w-4 text-blue-600" />
            Active Commitments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2 animate-pulse">
            <div className="h-12 bg-gray-100 rounded" />
            <div className="h-12 bg-gray-100 rounded" />
            <div className="h-12 bg-gray-100 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (commitments.length === 0) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
        <CardHeader className="pb-3 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Target className="h-4 w-4 text-blue-600" />
            Active Commitments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-6">
            <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No active commitments</p>
            <p className="text-xs text-gray-400 mt-1">
              Use Quick Commitment to add one
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
      <CardHeader className="pb-3 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Target className="h-4 w-4 text-blue-600" />
          Active Commitments
          <Badge variant="secondary" className="ml-auto text-xs">
            {commitments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          {commitments.map(commitment => {
            const isOverdue =
              commitment.target_date && isPast(new Date(commitment.target_date))
            const progress = commitment.progress_percentage || 0

            return (
              <div
                key={commitment.id}
                className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {commitment.title}
                    </p>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {/* Progress */}
                      {progress > 0 && (
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-700">
                            {progress}%
                          </span>
                        </div>
                      )}

                      {/* Due Date */}
                      {commitment.target_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar
                            className={`h-3 w-3 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}
                          />
                          <span
                            className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}
                          >
                            {isOverdue ? 'Overdue: ' : ''}
                            {format(new Date(commitment.target_date), 'MMM d')}
                          </span>
                        </div>
                      )}

                      {/* Type Badge */}
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 h-5"
                      >
                        {commitment.type}
                      </Badge>

                      {/* Priority */}
                      {commitment.priority === 'high' ||
                      commitment.priority === 'urgent' ? (
                        <Badge
                          variant="destructive"
                          className="text-xs px-1.5 py-0 h-5"
                        >
                          {commitment.priority}
                        </Badge>
                      ) : null}
                    </div>

                    {/* Progress Bar */}
                    {progress > 0 && (
                      <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {commitments.length === 5 && (
          <p className="text-xs text-gray-400 text-center mt-3">
            Showing 5 most recent
          </p>
        )}
      </CardContent>
    </Card>
  )
}
