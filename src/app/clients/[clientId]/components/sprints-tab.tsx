import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GoalsList } from '@/components/goals/goals-list'
import { SprintTargetsManager } from '@/components/sprints/sprint-targets-manager'
import { CommitmentsWidget } from '@/components/commitments/commitments-widget'
import { CurrentSprintWidget } from '@/components/client/current-sprint-widget'
import { Activity } from 'lucide-react'

interface SprintsTabProps {
  client: any
  selectedTargetId: string | null
  onRefresh: () => void
  onCreateSprint: () => void
  onTargetClick: (targetId: string | null) => void
  onEditCommitment: (commitment: any) => void
}

export function SprintsTab({
  client,
  selectedTargetId,
  onRefresh,
  onCreateSprint,
  onTargetClick,
  onEditCommitment,
}: SprintsTabProps) {
  return (
    <div className="space-y-6">
      {/* 1. Outcomes at Top */}
      <GoalsList
        clientId={client.id}
        onRefresh={onRefresh}
        showCreateButton={true}
      />

      {/* 2. Two Column Layout: Desired Wins (Left) + Commitments (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Desired Wins */}
        <div>
          <SprintTargetsManager
            clientId={client.id}
            onRefresh={onRefresh}
            onTargetClick={targetId => {
              onTargetClick(selectedTargetId === targetId ? null : targetId)
            }}
            selectedTargetId={selectedTargetId}
          />
        </div>

        {/* Right: Sprint Commitments */}
        <div>
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    <h3 className="font-semibold text-gray-900">
                      Sprint Commitments
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedTargetId
                      ? 'Filtered by selected desired win'
                      : 'All active commitments for current sprint'}
                  </p>
                </div>
                {selectedTargetId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTargetClick(null)}
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </CardHeader>
            <CommitmentsWidget
              clientId={client.id}
              limit={10}
              showHeader={false}
              viewAllLink={`/clients/${client.id}?tab=commitments`}
              targetId={selectedTargetId}
              onEdit={onEditCommitment}
            />
          </Card>
        </div>
      </div>

      {/* 3. Current Sprint Overview (Bottom, Full Width) */}
      <CurrentSprintWidget
        clientId={client.id}
        onRefresh={onRefresh}
        showStatusMenu={true}
        onCreateSprint={onCreateSprint}
      />
    </div>
  )
}
