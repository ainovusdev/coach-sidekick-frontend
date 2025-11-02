'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { Commitment } from '@/types/commitment'
import { CommitmentQuickComplete } from './commitment-quick-complete'
import {
  ArrowRight,
  Target,
  Loader2,
  AlertCircle,
  Edit,
  MoreVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, isPast, parseISO } from 'date-fns'

interface CommitmentsWidgetProps {
  clientId?: string
  limit?: number
  showHeader?: boolean
  viewAllLink?: string
  className?: string
  targetId?: string | null
  onEdit?: (commitment: Commitment) => void
}

/**
 * Commitments Widget - Now using TanStack Query
 *
 * Benefits:
 * - Cached data shows instantly across multiple widget instances
 * - Automatic background refresh
 * - No duplicate API calls
 */
export function CommitmentsWidget({
  clientId,
  limit = 5,
  showHeader = true,
  viewAllLink = '/client-portal/commitments',
  className,
  targetId,
  onEdit,
}: CommitmentsWidgetProps) {
  // Use TanStack Query for commitments
  const {
    data: commitmentsData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useCommitments({
    client_id: clientId,
    status: 'active',
    include_drafts: false,
  })

  const error = queryError ? 'Failed to load commitments' : null

  // Filter and sort commitments
  const displayCommitments = useMemo(() => {
    let commitmentsList = commitmentsData?.commitments || []

    // Filter by target if specified
    if (targetId) {
      commitmentsList = commitmentsList.filter(c =>
        c.linked_target_ids?.includes(targetId),
      )
    }

    // Sort by deadline and take top N
    return commitmentsList
      .sort((a, b) => {
        if (!a.target_date && !b.target_date) return 0
        if (!a.target_date) return 1
        if (!b.target_date) return -1
        return (
          new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
        )
      })
      .slice(0, limit)
  }, [commitmentsData, targetId, limit])

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
      <Card className={cn('bg-white border-gray-200 shadow-sm', className)}>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('bg-white border-gray-200 shadow-sm', className)}>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <p className="text-gray-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('bg-white border-gray-200 shadow-sm', className)}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5" />
              My Active Commitments
            </CardTitle>
            <Link href={viewAllLink}>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
      )}

      <CardContent>
        {displayCommitments.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600">No active commitments</p>
            <p className="text-sm text-gray-500 mt-1">
              Commitments from your coaching sessions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayCommitments.map(commitment => {
              const deadlineStatus = getDeadlineStatus(commitment)
              return (
                <div
                  key={commitment.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  {/* Quick Complete Checkbox */}
                  <div className="pt-0.5">
                    <CommitmentQuickComplete
                      commitment={commitment}
                      onComplete={() => refetch()}
                      size="md"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                      {commitment.title}
                    </h4>

                    {/* Compact Metadata */}
                    <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                      <Badge
                        variant="secondary"
                        className={cn(
                          commitment.type === 'action' &&
                            'bg-blue-100 text-blue-700',
                          commitment.type === 'habit' &&
                            'bg-purple-100 text-purple-700',
                          commitment.type === 'milestone' &&
                            'bg-green-100 text-green-700',
                        )}
                      >
                        {commitment.type}
                      </Badge>
                      {deadlineStatus && (
                        <span className={deadlineStatus.className}>
                          {deadlineStatus.text}
                        </span>
                      )}
                      {commitment.progress_percentage > 0 &&
                        commitment.progress_percentage < 100 && (
                          <span className="text-gray-600">
                            {commitment.progress_percentage}%
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Edit Menu */}
                  {onEdit && (
                    <div className="pt-0.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(commitment)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit & Link Targets
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              )
            })}

            <Link href={viewAllLink}>
              <Button className="w-full bg-gray-900 text-white hover:bg-gray-800 mt-2">
                View All Commitments
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
