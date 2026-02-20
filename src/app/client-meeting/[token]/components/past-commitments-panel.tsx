/**
 * Past Commitments Panel
 * Shows commitments from previous sessions
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  History,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Calendar,
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import {
  LiveMeetingService,
  PastCommitmentGroup,
} from '@/services/live-meeting-service'

interface PastCommitmentsPanelProps {
  meetingToken: string
  guestToken: string | null
  refreshKey?: number
}

export function PastCommitmentsPanel({
  meetingToken,
  guestToken,
  refreshKey,
}: PastCommitmentsPanelProps) {
  const [pastCommitments, setPastCommitments] = useState<PastCommitmentGroup[]>(
    [],
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  // Fetch past commitments
  useEffect(() => {
    if (!guestToken) return

    const fetchPastCommitments = async () => {
      setIsLoading(true)
      try {
        const data = await LiveMeetingService.getPastCommitments(
          meetingToken,
          guestToken,
        )
        setPastCommitments(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch past commitments:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPastCommitments()
  }, [meetingToken, guestToken, refreshKey])

  const totalCount = Array.isArray(pastCommitments)
    ? pastCommitments.reduce(
        (sum, group) =>
          sum +
          (Array.isArray(group?.commitments) ? group.commitments.length : 0),
        0,
      )
    : 0

  const getStatusIcon = (status: string) => {
    return status === 'completed' ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <Circle className="h-4 w-4 text-gray-300 dark:text-gray-500" />
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
      case 'active':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
      case 'abandoned':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  return (
    <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-800">
      <CardHeader
        className="border-b border-gray-100 dark:border-gray-700 py-3 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <History className="h-4 w-4" />
            Past Commitments
            {totalCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs"
              >
                {totalCount}
              </Badge>
            )}
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              Loading...
            </div>
          ) : !pastCommitments || pastCommitments.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <History className="h-6 w-6 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-xs">No past commitments</p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              <div className="p-3 space-y-4">
                {pastCommitments.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {/* Session Date Header */}
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {group.session_date
                        ? formatDate(group.session_date, 'MMM d, yyyy')
                        : 'Previous Sessions'}
                    </div>

                    {/* Commitments in this group */}
                    <div className="space-y-2 pl-3 border-l-2 border-gray-100 dark:border-gray-700">
                      {(group?.commitments || []).map(commitment => (
                        <div
                          key={commitment.id}
                          className="flex items-start gap-2"
                        >
                          {getStatusIcon(commitment.status)}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs ${
                                commitment.status === 'completed'
                                  ? 'text-gray-500 dark:text-gray-400 line-through'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {commitment.title}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-1.5 py-0 ${getStatusColor(commitment.status)}`}
                              >
                                {commitment.status}
                              </Badge>
                              {commitment.progress_percentage > 0 &&
                                commitment.progress_percentage < 100 && (
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                    {commitment.progress_percentage}%
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
