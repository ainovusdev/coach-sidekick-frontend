'use client'

import { Card } from '@/components/ui/card'
import { CommitmentSection } from '../hooks/use-commitments-view'
import { CommitmentRow, CommitmentRowHandlers } from './commitment-row'

interface CommitmentsFlatListProps {
  sections: CommitmentSection[]
  rowHandlers: CommitmentRowHandlers
  selectedDraftIds: Set<string>
}

/**
 * Default view: one flat, smart-sorted list split into
 * "My commitments" (assigned to the coach) and "Client commitments".
 */
export function CommitmentsFlatList({
  sections,
  rowHandlers,
  selectedDraftIds,
}: CommitmentsFlatListProps) {
  return (
    <div className="space-y-6">
      {sections.map(section => (
        <div key={section.key}>
          <div className="flex items-baseline gap-2 mb-2 px-1">
            <h2 className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
              {section.label}
            </h2>
            <span className="text-xs text-ink-4 tabular-nums">
              {section.commitments.length}
            </span>
          </div>
          <Card className="border-line overflow-hidden py-0 gap-0">
            {section.commitments.map(commitment => (
              <CommitmentRow
                key={commitment.id}
                commitment={commitment}
                showClient
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
