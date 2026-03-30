'use client'

import { useMyCommitments } from '@/hooks/queries/use-commitments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckSquare, Calendar, ArrowRight, User } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import Link from 'next/link'

export function MyCommitments() {
  const { data, isLoading } = useMyCommitments()
  const commitments = data?.commitments ?? []

  // Show only active commitments, sorted with overdue first, limited to 5
  const now = new Date()
  const activeCommitments = commitments
    .filter(c => c.status !== 'completed' && c.status !== 'abandoned')
    .sort((a, b) => {
      const aOverdue = a.target_date && new Date(a.target_date) < now ? 1 : 0
      const bOverdue = b.target_date && new Date(b.target_date) < now ? 1 : 0
      if (aOverdue !== bOverdue) return bOverdue - aOverdue // overdue first
      if (a.target_date && b.target_date)
        return (
          new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
        )
      return 0
    })
    .slice(0, 5)

  if (isLoading) {
    return (
      <Card className="border-gray-200 dark:border-gray-700 mb-6">
        <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <CardTitle className="text-base font-semibold">
              My Commitments
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show empty state if no coach commitments
  if (activeCommitments.length === 0) {
    return (
      <Card className="border-gray-200 dark:border-gray-700 mb-6">
        <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-amber-600" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No tasks assigned to you yet.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Create a commitment and assign it to yourself from any client page.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200 dark:border-gray-700 mb-6">
      <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-amber-600" />
            My Tasks
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
          >
            {activeCommitments.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {activeCommitments.map(commitment => (
            <Link
              key={commitment.id}
              href={`/clients/${commitment.client_id}?tab=overview`}
              className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {commitment.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <User className="h-3 w-3" />
                    <span>{commitment.client_name || 'Client'}</span>
                    {commitment.target_date && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">
                          |
                        </span>
                        <Calendar className="h-3 w-3" />
                        {new Date(commitment.target_date) < now ? (
                          <span className="text-red-500 font-medium">
                            Overdue -{' '}
                            {formatDate(commitment.target_date, 'MMM d')}
                          </span>
                        ) : (
                          <span>
                            {formatDate(commitment.target_date, 'MMM d')}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
