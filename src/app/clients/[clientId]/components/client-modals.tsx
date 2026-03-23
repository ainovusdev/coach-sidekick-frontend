import ClientModal from '@/components/clients/client-modal'
import { ManualSessionModal } from '@/components/sessions/manual-session-modal'
import { ClientInvitationModal } from '@/components/clients/client-invitation-modal'
import { SprintFormModal } from '@/components/sprints/sprint-form-modal'
import { TargetFormModal } from '@/components/sprints/target-form-modal'
import { EndSprintModal } from './end-sprint-modal'
import { CommitmentCreatePanel } from '@/components/commitments/commitment-create-panel'
import { StartSessionModal } from './start-session-modal'
import { GoalFormModal } from '@/components/goals/goal-form-modal'
import { UnifiedCreationModal } from './unified-creation-modal'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useGoals } from '@/hooks/queries/use-goals'
import { useSprints } from '@/hooks/queries/use-sprints'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'

interface ClientModalsProps {
  client: any
  isEditModalOpen: boolean
  setIsEditModalOpen: (open: boolean) => void
  isManualSessionModalOpen: boolean
  setIsManualSessionModalOpen: (open: boolean) => void
  isInviteModalOpen: boolean
  setIsInviteModalOpen: (open: boolean) => void
  isSprintModalOpen: boolean
  setIsSprintModalOpen: (open: boolean) => void
  isStartSessionModalOpen: boolean
  setIsStartSessionModalOpen: (open: boolean) => void
  isGoalModalOpen: boolean
  setIsGoalModalOpen: (open: boolean) => void
  isOutcomeModalOpen: boolean
  setIsOutcomeModalOpen: (open: boolean) => void
  isUnifiedCreateModalOpen: boolean
  setIsUnifiedCreateModalOpen: (open: boolean) => void
  isEndSprintModalOpen: boolean
  setIsEndSprintModalOpen: (open: boolean) => void
  endingSprint: any
  setEndingSprint: (sprint: any) => void
  editingGoal: any
  setEditingGoal: (goal: any) => void
  showCommitmentCreatePanel: boolean
  setShowCommitmentCreatePanel: (open: boolean) => void
  onRefresh: () => void
  onCommitmentCreated?: (commitmentId: string) => void
}

export function ClientModals({
  client,
  isEditModalOpen,
  setIsEditModalOpen,
  isManualSessionModalOpen,
  setIsManualSessionModalOpen,
  isInviteModalOpen,
  setIsInviteModalOpen,
  isSprintModalOpen,
  setIsSprintModalOpen,
  isStartSessionModalOpen,
  setIsStartSessionModalOpen,
  isGoalModalOpen,
  setIsGoalModalOpen,
  isOutcomeModalOpen,
  setIsOutcomeModalOpen,
  isUnifiedCreateModalOpen,
  setIsUnifiedCreateModalOpen,
  isEndSprintModalOpen,
  setIsEndSprintModalOpen,
  endingSprint,
  setEndingSprint,
  editingGoal,
  setEditingGoal,
  showCommitmentCreatePanel,
  setShowCommitmentCreatePanel,
  onRefresh,
  onCommitmentCreated,
}: ClientModalsProps) {
  const queryClient = useQueryClient()

  // Fetch goals and sprints for outcome modal
  const { data: goals = [] } = useGoals(client.id)
  const { data: sprints = [] } = useSprints({
    client_id: client.id,
    status: 'active',
  })
  // Get unfinished commitments for the sprint being ended
  const { data: commitmentsData } = useCommitments({
    client_id: client.id,
    status: 'active',
  })

  const unfinishedCommitments = endingSprint
    ? (commitmentsData?.commitments || []).filter((commitment: any) =>
        commitment.target_links?.some(
          (link: any) => link.target?.sprint_id === endingSprint.id,
        ),
      )
    : []

  return (
    <>
      <ClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={onRefresh}
        client={client}
        mode="edit"
      />

      <ClientInvitationModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        clientId={client.id}
        clientName={client.name}
        clientEmail={client.email}
        invitationStatus={client.invitation_status}
        onInvitationSent={onRefresh}
      />

      <ManualSessionModal
        isOpen={isManualSessionModalOpen}
        onClose={() => {
          setIsManualSessionModalOpen(false)
          onRefresh()
        }}
        preselectedClientId={client.id}
      />

      <SprintFormModal
        open={isSprintModalOpen}
        onOpenChange={setIsSprintModalOpen}
        clientId={client.id}
        onSuccess={onRefresh}
      />

      <EndSprintModal
        open={isEndSprintModalOpen}
        onOpenChange={setIsEndSprintModalOpen}
        sprint={endingSprint}
        unfinishedCommitments={unfinishedCommitments}
        onSuccess={() => {
          setEndingSprint(null)
          onRefresh()
        }}
      />

      <StartSessionModal
        isOpen={isStartSessionModalOpen}
        onClose={() => setIsStartSessionModalOpen(false)}
        clientId={client.id}
        clientName={client.name}
      />

      <GoalFormModal
        open={isGoalModalOpen}
        onOpenChange={open => {
          setIsGoalModalOpen(open)
          if (!open) setEditingGoal(null)
        }}
        clientId={client.id}
        goal={editingGoal}
        mode={editingGoal ? 'edit' : 'create'}
        onSuccess={() => {
          // Invalidate goals query to refresh the tree view
          queryClient.invalidateQueries({
            queryKey: queryKeys.goals.all,
          })
          setEditingGoal(null)
          onRefresh()
        }}
      />

      <TargetFormModal
        open={isOutcomeModalOpen}
        onOpenChange={setIsOutcomeModalOpen}
        sprintId={sprints[0]?.id}
        goals={goals.map((g: any) => ({ id: g.id, title: g.title }))}
        onSuccess={() => {
          // Invalidate targets query to refresh the tree view
          queryClient.invalidateQueries({
            queryKey: queryKeys.targets.all,
          })
          onRefresh()
        }}
      />

      <UnifiedCreationModal
        open={isUnifiedCreateModalOpen}
        onOpenChange={setIsUnifiedCreateModalOpen}
        clientId={client.id}
        goals={goals}
        sprints={sprints}
        onSuccess={() => {
          // Invalidate all queries to refresh everything
          queryClient.invalidateQueries({
            queryKey: queryKeys.goals.all,
          })
          queryClient.invalidateQueries({
            queryKey: queryKeys.targets.all,
          })
          queryClient.invalidateQueries({
            queryKey: queryKeys.commitments.all,
          })
          queryClient.invalidateQueries({
            queryKey: queryKeys.sprints.all,
          })
          onRefresh()
        }}
        onCreateCommitment={() => {
          setIsUnifiedCreateModalOpen(false)
          setShowCommitmentCreatePanel(true)
        }}
      />

      <CommitmentCreatePanel
        isOpen={showCommitmentCreatePanel}
        onClose={() => setShowCommitmentCreatePanel(false)}
        clientId={client.id}
        onCreated={commitment => {
          setShowCommitmentCreatePanel(false)
          onRefresh()
          onCommitmentCreated?.(commitment.id)
        }}
      />
    </>
  )
}
