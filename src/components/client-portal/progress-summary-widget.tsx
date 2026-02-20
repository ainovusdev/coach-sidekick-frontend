'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Target, ArrowRight } from 'lucide-react'
import { useClientOutcomes } from '@/hooks/queries/use-client-outcomes'
import { useCommitments } from '@/hooks/queries/use-commitments'

interface ProgressSummaryWidgetProps {
  clientId?: string
}

export function ProgressSummaryWidget({
  clientId,
}: ProgressSummaryWidgetProps) {
  const { data: outcomes } = useClientOutcomes()
  const { data: commitmentsData } = useCommitments(
    clientId ? { client_id: clientId, status: 'active' } : { status: 'active' },
  )

  const activeOutcomes = outcomes?.filter(o => o.status === 'active') ?? []
  const completedOutcomes =
    outcomes?.filter(o => o.status === 'completed') ?? []
  const avgProgress =
    outcomes && outcomes.length > 0
      ? Math.round(
          outcomes.reduce((s, o) => s + o.progress_percentage, 0) /
            outcomes.length,
        )
      : 0

  const activeCommitments =
    commitmentsData?.commitments?.filter(c => c.status === 'active') ?? []
  const completedCommitments =
    commitmentsData?.commitments?.filter(c => c.status === 'completed') ?? []

  const totalItems =
    activeOutcomes.length +
    activeCommitments.length +
    completedOutcomes.length +
    completedCommitments.length
  if (totalItems === 0) return null

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-600" />
            Commitments & Outcomes
          </CardTitle>
          <Link href="/client-portal/my-commitments">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 mb-3">
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-gray-900">
              {activeOutcomes.length + activeCommitments.length}
            </p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-gray-900">
              {completedOutcomes.length + completedCommitments.length}
            </p>
            <p className="text-xs text-gray-500">Done</p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span className="font-medium">{avgProgress}%</span>
          </div>
          <Progress value={avgProgress} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  )
}
