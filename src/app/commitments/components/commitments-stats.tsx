'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CommitmentStats } from '@/types/commitment'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Target, TrendingUp } from 'lucide-react'

interface CommitmentsStatsProps {
  stats?: CommitmentStats
  fallbackActive: number
  fallbackCompleted: number
  overdueFilterActive: boolean
  onToggleOverdue: () => void
}

export function CommitmentsStats({
  stats,
  fallbackActive,
  fallbackCompleted,
  overdueFilterActive,
  onToggleOverdue,
}: CommitmentsStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <Card className="border-line ">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-ds-accent" />
            <span className="text-xs text-ink-3 font-medium">Active</span>
          </div>
          <p className="text-xl font-bold text-ink ">
            {stats?.total_active ?? fallbackActive}
          </p>
        </CardContent>
      </Card>
      <Card className="border-line ">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-forest" />
            <span className="text-xs text-ink-3 font-medium">Completed</span>
          </div>
          <p className="text-xl font-bold text-ink ">
            {stats?.total_completed ?? fallbackCompleted}
          </p>
        </CardContent>
      </Card>
      {/* At Risk doubles as an overdue quick-filter */}
      <Card
        role="button"
        tabIndex={0}
        aria-pressed={overdueFilterActive}
        onClick={onToggleOverdue}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleOverdue()
          }
        }}
        className={cn(
          'border-line cursor-pointer transition-colors hover:border-vermillion',
          overdueFilterActive && 'border-vermillion ring-1 ring-vermillion',
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-vermillion" />
            <span className="text-xs text-ink-3 font-medium">At Risk</span>
          </div>
          <p className="text-xl font-bold text-ink ">
            {stats?.at_risk_count ?? 0}
          </p>
          <p className="text-[11px] text-ink-4 mt-0.5">
            {overdueFilterActive ? 'Showing overdue only' : 'Click to filter'}
          </p>
        </CardContent>
      </Card>
      <Card className="border-line ">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-forest" />
            <span className="text-xs text-ink-3 font-medium">
              Completion Rate
            </span>
          </div>
          <p className="text-xl font-bold text-ink ">
            {stats?.completion_rate ?? 0}%
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
