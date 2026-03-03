'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Target, User } from 'lucide-react'
import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface GroupAggregatedCommitmentsProps {
  sessionId: string
}

interface GroupedCommitment {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  target_date: string | null
}

interface ClientGroup {
  client_id: string
  client_name: string
  commitments: GroupedCommitment[]
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'in_progress':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'draft':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

export function GroupAggregatedCommitments({
  sessionId,
}: GroupAggregatedCommitmentsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['commitments', 'group', sessionId],
    queryFn: async () => {
      const response = await ApiClient.get(
        `${BACKEND_URL}/commitments/group/${sessionId}`,
      )
      return response as { groups: ClientGroup[]; total: number }
    },
    enabled: !!sessionId,
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return (
      <Card className="border-app-border shadow-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const groups = data?.groups || []

  return (
    <Card className="border-app-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-app-secondary" />
          <h3 className="text-sm font-semibold text-app-primary">
            All Participant Commitments
          </h3>
          {data?.total != null && (
            <span className="text-xs text-app-secondary">({data.total})</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {groups.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-10 w-10 mx-auto mb-3 text-app-secondary" />
            <p className="text-app-secondary text-sm">
              No commitments across participants
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(group => (
              <div key={group.client_id}>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-3.5 w-3.5 text-app-secondary" />
                  <span className="text-xs font-semibold text-app-secondary uppercase tracking-wide">
                    {group.client_name}
                  </span>
                  <span className="text-xs text-app-secondary">
                    ({group.commitments.length})
                  </span>
                </div>
                <div className="space-y-2 pl-5">
                  {group.commitments.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-app-border"
                    >
                      <span className="text-sm text-app-primary">
                        {c.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(c.status)}`}
                      >
                        {c.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
