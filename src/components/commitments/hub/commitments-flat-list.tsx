'use client'

import { Card } from '@/components/ui/card'
import { CommitmentSectionData } from './use-commitments-view'
import { CommitmentRow, CommitmentRowHandlers } from './commitment-row'

interface CommitmentsFlatListProps {
  sections: CommitmentSectionData[]
  rowHandlers: CommitmentRowHandlers
  selectedDraftIds: Set<string>
  /** With a single section under a chosen view, the heading repeats the
   *  filter — drop it. */
  hideSingleHeading?: boolean
}

/**
 * Default view: one flat, smart-sorted list split by who each row is for —
 * "Assigned to me", "Unassigned", "Assigned to clients", "Assigned to others".
 */
export function CommitmentsFlatList({
  sections,
  rowHandlers,
  selectedDraftIds,
  hideSingleHeading = false,
}: CommitmentsFlatListProps) {
  const showHeadings = !(hideSingleHeading && sections.length === 1)
  return (
    <div className="space-y-6">
      {sections.map(section => (
        <div key={section.key} data-testid={`hub-section-${section.key}`}>
          {showHeadings && (
            <div className="flex items-baseline gap-2 mb-2 px-1">
              <h2 className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                {section.label}
              </h2>
              <span className="text-xs text-ink-4 tabular-nums">
                {section.commitments.length}
              </span>
            </div>
          )}
          <Card className="border-line overflow-hidden py-0 gap-0">
            {section.commitments.map(commitment => (
              <CommitmentRow
                key={commitment.id}
                commitment={commitment}
                showClient
                showAssignee={section.key !== 'mine'}
                isSelected={selectedDraftIds.has(commitment.id)}
                {...rowHandlers}
              />
            ))}
          </Card>
        </div>
      ))}
    </div>
  )
}
