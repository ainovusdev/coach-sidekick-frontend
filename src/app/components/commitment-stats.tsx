'use client'

import { useCommitmentStats } from '@/hooks/queries/use-commitments'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'

export function CommitmentStatsRow() {
  const { data: stats, isLoading } = useCommitmentStats()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border-line ">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const items = [
    {
      label: 'Active',
      value: stats.total_active,
      icon: Activity,
      iconColor: 'text-ds-accent',
    },
    {
      label: 'Completed',
      value: stats.total_completed,
      icon: CheckCircle2,
      iconColor: 'text-forest',
    },
    {
      label: 'At Risk',
      value: stats.at_risk_count,
      icon: AlertCircle,
      iconColor: stats.at_risk_count > 0 ? 'text-vermillion' : 'text-ink-4',
    },
    {
      label: 'Completion Rate',
      value: `${stats.completion_rate}%`,
      icon: TrendingUp,
      iconColor: 'text-forest',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {items.map(item => {
        const Icon = item.icon
        return (
          <Card key={item.label} className="border-line ">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${item.iconColor}`} />
                <span className="text-xs text-ink-3 font-medium">
                  {item.label}
                </span>
              </div>
              <p className="text-xl font-bold text-ink ">{item.value}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
