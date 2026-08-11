import type { ReactNode } from 'react'
import {
  DetailSidePanel,
  DetailSection,
  DetailRow,
  StatusBadge,
  PanelActions,
  LinkedItem,
  CommitmentsSection,
} from 'coach-sidekick'
import { Flag, Target } from 'lucide-react'

const sprintCommitments = [
  {
    id: 'c1',
    title: 'Delegate the weekly ops report to Priya',
    status: 'completed',
    target_date: '2026-07-10',
  },
  {
    id: 'c2',
    title: 'Hold three skip-level conversations',
    status: 'in_progress',
    target_date: '2026-07-24',
  },
  {
    id: 'c3',
    title: 'Review delegation scorecard together',
    status: 'active',
    target_date: '2026-07-31',
    is_coach_commitment: true,
  },
]

// The single-card harness wraps stories in a transformed container
// (.ds-single { transform: translateZ(0) }), which becomes the containing
// block for the panel's `position: fixed` — but it has zero height, so the
// panel's h-full collapses. This wrapper re-establishes a full-viewport
// containing block (inline styles: no Tailwind recompile needed).
const FixedViewport = ({ children }: { children: ReactNode }) => (
  <div style={{ height: '100vh', transform: 'translateZ(0)' }}>{children}</div>
)

export const SprintDetail = () => (
  <FixedViewport>
    <DetailSidePanel
      onClose={() => {}}
      eyebrow="Sprint"
      title="Q3 Delegation Sprint"
      icon={<Flag className="h-5 w-5 text-ds-accent" />}
      statusBadge={<StatusBadge status="in_progress" />}
      actions={
        <PanelActions
          onEdit={() => {}}
          onComplete={() => {}}
          canComplete
          onDelete={() => {}}
          deleteLabel="Delete sprint"
        />
      }
    >
      <DetailSection title="Description">
        <p className="text-sm text-ink-2 leading-relaxed">
          Build the habit of delegating outcomes instead of tasks. Maya hands
          off two recurring responsibilities this quarter and coaches her leads
          through the first cycle rather than stepping back in.
        </p>
      </DetailSection>
      <DetailSection title="Details">
        <DetailRow label="Client">Maya Chen</DetailRow>
        <DetailRow label="Timeframe">Jul 1 – Sep 30, 2026</DetailRow>
        <DetailRow label="Check-in cadence">Every session</DetailRow>
      </DetailSection>
      <DetailSection title="Linked outcome">
        <LinkedItem
          icon={<Target className="h-4 w-4 text-ink-3" />}
          title="Lead through others, not around them"
          status="active"
        />
      </DetailSection>
      <CommitmentsSection commitments={sprintCommitments} />
    </DetailSidePanel>
  </FixedViewport>
)
