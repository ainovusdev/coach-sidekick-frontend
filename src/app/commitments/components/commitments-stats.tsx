'use client'

import { CommitmentStats } from '@/types/commitment'
import { cn } from '@/lib/utils'

interface CommitmentsStatsProps {
  stats?: CommitmentStats
  fallbackActive: number
  fallbackCompleted: number
  overdueFilterActive: boolean
  onToggleOverdue: () => void
}

/**
 * One quiet inline strip instead of stat cards. "At risk" is the only
 * colored + interactive figure — it doubles as the overdue quick-filter.
 */
export function CommitmentsStats({
  stats,
  fallbackActive,
  fallbackCompleted,
  overdueFilterActive,
  onToggleOverdue,
}: CommitmentsStatsProps) {
  const atRisk = stats?.at_risk_count ?? 0

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 mb-6 px-1">
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-semibold text-ink tabular-nums">
          {stats?.total_active ?? fallbackActive}
        </span>
        <span className="text-xs text-ink-3">active</span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-semibold text-ink tabular-nums">
          {stats?.total_completed ?? fallbackCompleted}
        </span>
        <span className="text-xs text-ink-3">completed</span>
      </div>

      <button
        onClick={onToggleOverdue}
        aria-pressed={overdueFilterActive}
        title={
          overdueFilterActive
            ? 'Showing overdue only — click to clear'
            : 'Show overdue commitments only'
        }
        className={cn(
          'flex items-baseline gap-1.5 rounded-md -mx-2 px-2 py-0.5 transition-colors',
          'hover:bg-vermillion-bg/60',
          overdueFilterActive && 'bg-vermillion-bg ring-1 ring-vermillion/40',
        )}
      >
        <span
          className={cn(
            'text-lg font-semibold tabular-nums',
            atRisk > 0 ? 'text-vermillion' : 'text-ink',
          )}
        >
          {atRisk}
        </span>
        <span
          className={cn(
            'text-xs',
            overdueFilterActive ? 'text-vermillion' : 'text-ink-3',
          )}
        >
          at risk
        </span>
      </button>

      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-semibold text-ink tabular-nums">
          {stats?.completion_rate ?? 0}%
        </span>
        <span className="text-xs text-ink-3">completion</span>
      </div>
    </div>
  )
}
