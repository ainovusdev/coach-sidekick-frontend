'use client'

/**
 * VisionDetailPanel — read-only detail drawer for a Vision (backend `goal`).
 * Opened by clicking a Vision row on the goals tree board. Editing/deleting is
 * delegated to the existing Vision form modal / confirm dialog via the passed
 * handlers (see plan: no inline editing).
 */

import { Target, Zap } from 'lucide-react'
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
import type { Goal } from '@/services/goal-service'
import type { Target as OutcomeTarget } from '@/types/sprint'

interface VisionDetailPanelProps {
  goal: Goal
  linkedOutcomes: OutcomeTarget[]
  commitments: any[]
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onCommitmentClick?: (commitment: any) => void
}

export function VisionDetailPanel({
  goal,
  linkedOutcomes,
  commitments,
  onClose,
  onEdit,
  onDelete,
  onCommitmentClick,
}: VisionDetailPanelProps) {
  return (
    <DetailSidePanel
      onClose={onClose}
      eyebrow="Vision"
      icon={<Target className="h-5 w-5 text-ink-3" />}
      title={goal.title}
      statusBadge={<StatusBadge status={goal.status} />}
      actions={
        <PanelActions
          onEdit={onEdit}
          onDelete={onDelete}
          deleteLabel="Delete Vision"
        />
      }
    >
      <DetailSection title="Details">
        <DetailRow label="Category">
          <span className="capitalize">{goal.category || '—'}</span>
        </DetailRow>
        <DetailRow label="Due date">
          {goal.target_date ? formatDateOnly(goal.target_date) : '—'}
        </DetailRow>
        <DetailRow label="Progress">{goal.progress ?? 0}%</DetailRow>
      </DetailSection>

      <div className="space-y-1.5">
        <Progress value={goal.progress ?? 0} className="h-2" />
      </div>

      {goal.description && (
        <DetailSection title="Description">
          <p className="text-sm text-ink-2 whitespace-pre-wrap break-words">
            {goal.description}
          </p>
        </DetailSection>
      )}

      <DetailSection
        title={`Meta Performance Outcomes (${linkedOutcomes.length})`}
      >
        {linkedOutcomes.length === 0 ? (
          <EmptyHint>No outcomes linked to this vision yet.</EmptyHint>
        ) : (
          <div className="space-y-1.5">
            {linkedOutcomes.map(outcome => (
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
        <DetailRow label="Created">{formatDateOnly(goal.created_at)}</DetailRow>
        <DetailRow label="Last updated">
          {formatDateOnly(goal.updated_at)}
        </DetailRow>
      </DetailSection>
    </DetailSidePanel>
  )
}
