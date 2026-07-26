'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { formatDateOnly } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import {
  Calendar,
  ChevronRight,
  FileText,
  Layers,
  UserCircle,
} from 'lucide-react'
import { CommitmentGroup, CommitmentGroupBy } from '../utils/commitment-view'
import { CommitmentRow, CommitmentRowHandlers } from './commitment-row'

interface CommitmentsGroupedListProps {
  groups: CommitmentGroup[]
  groupBy: Exclude<CommitmentGroupBy, 'none'>
  rowHandlers: CommitmentRowHandlers
  selectedDraftIds: Set<string>
}

function GroupIcon({
  groupBy,
  isManual,
}: {
  groupBy: Exclude<CommitmentGroupBy, 'none'>
  isManual: boolean
}) {
  if (groupBy === 'client')
    return <UserCircle className="h-4 w-4 text-ink-on-dark " />
  if (groupBy === 'session')
    return isManual ? (
      <FileText className="h-4 w-4 text-ink-on-dark " />
    ) : (
      <Calendar className="h-4 w-4 text-ink-on-dark " />
    )
  return <Layers className="h-4 w-4 text-ink-on-dark " />
}

/**
 * Collapsible group cards for the By client / By session / By status views.
 * Collapse state lives here — remount with `key={groupBy}` to reset it.
 */
export function CommitmentsGroupedList({
  groups,
  groupBy,
  rowHandlers,
  selectedDraftIds,
}: CommitmentsGroupedListProps) {
  // Track collapsed (not expanded) so new groups default to open
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggle = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {groups.map(group => {
        const isOpen = !collapsed.has(group.key)
        return (
          <Collapsible
            key={group.key}
            open={isOpen}
            onOpenChange={() => toggle(group.key)}
          >
            <Card className="border-line overflow-hidden py-0 gap-0">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-paper transition-colors text-left">
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-ink-4 transition-transform flex-shrink-0',
                      isOpen && 'rotate-90',
                    )}
                  />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-ink flex-shrink-0">
                    <GroupIcon
                      groupBy={groupBy}
                      isManual={group.key === '__manual__'}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-ink truncate">
                      {group.label}
                      {groupBy === 'session' && group.dateISO && (
                        <span className="text-ink-3 font-normal">
                          {' '}
                          — {formatDateOnly(group.dateISO, 'MMM d, yyyy')}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {groupBy !== 'status' ? (
                      <>
                        {group.draftCount > 0 && (
                          <Badge className="bg-surface-3 text-ink-3 text-xs">
                            {group.draftCount} draft
                            {group.draftCount !== 1 && 's'}
                          </Badge>
                        )}
                        {group.activeCount > 0 && (
                          <Badge className="bg-ds-accent-bg text-ds-accent text-xs">
                            {group.activeCount} active
                          </Badge>
                        )}
                        {group.completedCount > 0 && (
                          <Badge className="bg-forest-bg text-forest text-xs">
                            {group.completedCount} done
                          </Badge>
                        )}
                      </>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {group.commitments.length}
                      </Badge>
                    )}
                  </div>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t border-line ">
                  {group.commitments.map(commitment => (
                    <CommitmentRow
                      key={commitment.id}
                      commitment={commitment}
                      showClient={groupBy !== 'client'}
                      isSelected={selectedDraftIds.has(commitment.id)}
                      {...rowHandlers}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )
      })}
    </div>
  )
}
