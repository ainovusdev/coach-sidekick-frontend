'use client'

import { Card, CardContent } from '@/components/ui/card'
import { GroupSessionParticipant } from '@/types/group-session'

interface GroupCommitmentsTabProps {
  masterSessionId: string
  participants: GroupSessionParticipant[]
}

/**
 * @deprecated Use GroupAggregatedCommitments in the unified session detail page instead.
 */
export function GroupCommitmentsTab({
  masterSessionId: _masterSessionId,
  participants: _participants,
}: GroupCommitmentsTabProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          This view has been replaced. Please use the unified session detail
          page.
        </p>
      </CardContent>
    </Card>
  )
}
