'use client'

/**
 * OutcomeDetailPanel — read-only detail drawer for a Meta Performance Outcome
 * (backend `target`). Opened by clicking an outcome row on the goals tree
 * board. Edit / Complete / Delete are delegated to the existing outcome form
 * modal + handlers (no inline editing).
 */

import { Zap, Target as TargetIcon, Calendar } from 'lucide-react'
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
import { formatDateOnly } from '@/lib/date-utils'
import type { Target, Sprint } from '@/types/sprint'

interface OutcomeDetailPanelProps {
  outcome: Target
  linkedSprints: Sprint[]
  commitments: any[]
  onClose: () => void
  onEdit?: () => void
  onComplete?: () => void
  onDelete?: () => void
  onCommitmentClick?: (commitment: any) => void
}

export function OutcomeDetailPanel({
  outcome,
  linkedSprints,
  commitments,
  onClose,
  onEdit,
  onComplete,
  onDelete,
  onCommitmentClick,
}: OutcomeDetailPanelProps) {
  const visionTitles = outcome.goal_titles || []
  const total = outcome.commitment_count ?? 0
  const done = outcome.completed_commitment_count ?? 0

  return (
    <DetailSidePanel
      onClose={onClose}
      eyebrow="Meta Performance Outcome"
      icon={<Zap className="h-5 w-5 text-ds-accent" />}
      title={outcome.title}
      statusBadge={<StatusBadge status={outcome.status} />}
      actions={
        <PanelActions
          onEdit={onEdit}
          onComplete={onComplete}
          canComplete={outcome.status !== 'completed'}
          onDelete={onDelete}
          deleteLabel="Delete Outcome"
        />
      }
    >
      <DetailSection title="Details">
        <DetailRow label="Due date">
          {outcome.target_date ? formatDateOnly(outcome.target_date) : '—'}
        </DetailRow>
        <DetailRow label="Progress">
          {outcome.progress_percentage ?? 0}%
        </DetailRow>
        <DetailRow label="Commitments">
          {done} of {total} complete
        </DetailRow>
      </DetailSection>

      <div className="space-y-1.5">
        <Progress value={outcome.progress_percentage ?? 0} className="h-2" />
      </div>

      {outcome.description && (
        <DetailSection title="Description">
          <p className="text-sm text-ink-2 whitespace-pre-wrap break-words">
            {outcome.description}
          </p>
        </DetailSection>
      )}

      <DetailSection title={`Visions (${visionTitles.length})`}>
        {visionTitles.length === 0 ? (
          <EmptyHint>Not linked to a vision.</EmptyHint>
        ) : (
          <div className="space-y-1.5">
            {visionTitles.map((title, i) => (
              <LinkedItem
                key={`${title}-${i}`}
                icon={<TargetIcon className="h-4 w-4 text-ink-3" />}
                title={title}
              />
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection title={`Sprints (${linkedSprints.length})`}>
        {linkedSprints.length === 0 ? (
          <EmptyHint>No sprints linked to this outcome yet.</EmptyHint>
        ) : (
          <div className="space-y-1.5">
            {linkedSprints.map(sprint => (
              <LinkedItem
                key={sprint.id}
                icon={<Calendar className="h-4 w-4 text-forest" />}
                title={sprint.title}
                status={sprint.status}
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
          {formatDateOnly(outcome.created_at)}
        </DetailRow>
        <DetailRow label="Last updated">
          {formatDateOnly(outcome.updated_at)}
        </DetailRow>
      </DetailSection>
    </DetailSidePanel>
  )
}
