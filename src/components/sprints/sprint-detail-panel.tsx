'use client'

/**
 * SprintDetailPanel — read-only detail drawer for a Sprint. Opened by clicking
 * a sprint row on the goals tree board. Base fields render immediately from the
 * row's loaded object; linked outcomes are hydrated via the existing
 * `useSprint` (SprintDetail.targets). Edit / Complete / Delete delegate to the
 * existing sprint form modal + handlers (no inline editing).
 */

import { Calendar, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DetailSidePanel,
  DetailSection,
  DetailRow,
  StatusBadge,
  PanelActions,
  EmptyHint,
  LinkedItem,
  CommitmentsSection,
} from '@/components/ui/detail-side-panel'
import { useSprint } from '@/hooks/queries/use-sprints'
import { formatDateOnly } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { Sprint } from '@/types/sprint'

interface SprintDetailPanelProps {
  sprint: Sprint
  commitments: any[]
  onClose: () => void
  onEdit?: () => void
  onComplete?: () => void
  onDelete?: () => void
  onCommitmentClick?: (commitment: any) => void
}

export function SprintDetailPanel({
  sprint,
  commitments,
  onClose,
  onEdit,
  onComplete,
  onDelete,
  onCommitmentClick,
}: SprintDetailPanelProps) {
  // Hydrate linked outcomes; base fields come from the passed row object.
  const { data: detail } = useSprint(sprint.id)
  const outcomes = detail?.targets ?? []
  const progress =
    detail?.progress_percentage ?? sprint.progress_percentage ?? 0

  return (
    <DetailSidePanel
      onClose={onClose}
      eyebrow={`Sprint${sprint.sprint_number ? ` #${sprint.sprint_number}` : ''}`}
      icon={<Calendar className="h-5 w-5 text-forest" />}
      title={sprint.title}
      statusBadge={
        <div className="flex items-center gap-2">
          <StatusBadge status={sprint.status} />
          {sprint.is_current && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                'bg-forest-bg text-forest border-forest',
              )}
            >
              Current
            </Badge>
          )}
        </div>
      }
      actions={
        <PanelActions
          onEdit={onEdit}
          onComplete={onComplete}
          canComplete={sprint.status !== 'completed'}
          onDelete={onDelete}
          deleteLabel="Delete Sprint"
        />
      }
    >
      <DetailSection title="Details">
        <DetailRow label="Timeframe">
          {formatDateOnly(sprint.start_date)} –{' '}
          {formatDateOnly(sprint.end_date)}
        </DetailRow>
        {sprint.duration_weeks != null && (
          <DetailRow label="Duration">
            {sprint.duration_weeks} week{sprint.duration_weeks === 1 ? '' : 's'}
          </DetailRow>
        )}
        <DetailRow label="Progress">{progress}%</DetailRow>
      </DetailSection>

      <div className="space-y-1.5">
        <Progress value={progress} className="h-2" />
      </div>

      {sprint.description && (
        <DetailSection title="Description">
          <p className="text-sm text-ink-2 whitespace-pre-wrap break-words">
            {sprint.description}
          </p>
        </DetailSection>
      )}

      <DetailSection title={`Meta Performance Outcomes (${outcomes.length})`}>
        {outcomes.length === 0 ? (
          <EmptyHint>No outcomes linked to this sprint yet.</EmptyHint>
        ) : (
          <div className="space-y-1.5">
            {outcomes.map(outcome => (
              <LinkedItem
                key={outcome.id}
                icon={<Zap className="h-4 w-4 text-ds-accent" />}
                title={outcome.title}
                status={outcome.status}
              />
            ))}
          </div>
        )}
      </DetailSection>

      <CommitmentsSection
        commitments={commitments}
        onCommitmentClick={onCommitmentClick}
      />

      <DetailSection title="Metadata">
        <DetailRow label="Created">
          {formatDateOnly(sprint.created_at)}
        </DetailRow>
        <DetailRow label="Last updated">
          {formatDateOnly(sprint.updated_at)}
        </DetailRow>
      </DetailSection>
    </DetailSidePanel>
  )
}
