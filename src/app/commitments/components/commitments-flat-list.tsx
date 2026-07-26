'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserCheck, Users } from 'lucide-react'
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
          <div className="flex items-center gap-2 mb-2 px-1">
            {section.key === 'mine' ? (
              <UserCheck className="h-4 w-4 text-ink-3" strokeWidth={1.75} />
            ) : (
              <Users className="h-4 w-4 text-ink-3" strokeWidth={1.75} />
            )}
            <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wide">
              {section.label}
            </h2>
            <Badge variant="outline" className="text-xs">
              {section.commitments.length}
            </Badge>
            {section.key === 'mine' && (
              <span className="text-xs text-ink-4">assigned to you</span>
            )}
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
