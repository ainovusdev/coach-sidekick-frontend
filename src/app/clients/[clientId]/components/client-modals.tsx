import ClientModal from '@/components/clients/client-modal'
import { ManualSessionModal } from '@/components/sessions/manual-session-modal'
import { ClientInvitationModal } from '@/components/clients/client-invitation-modal'
import { SprintFormModal } from '@/components/sprints/sprint-form-modal'
import { TargetFormModal } from '@/components/sprints/target-form-modal'
import { EndSprintModal } from './end-sprint-modal'
import { CommitmentForm } from '@/components/commitments/commitment-form'
import { StartSessionModal } from './start-session-modal'
import { GoalFormModal } from '@/components/goals/goal-form-modal'
import { CommitmentService } from '@/services/commitment-service'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useGoals } from '@/hooks/queries/use-goals'
import { useSprints } from '@/hooks/queries/use-sprints'

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
  isEndSprintModalOpen: boolean
  setIsEndSprintModalOpen: (open: boolean) => void
  endingSprint: any
  setEndingSprint: (sprint: any) => void
  editingGoal: any
  setEditingGoal: (goal: any) => void
  showCommitmentForm: boolean
  setShowCommitmentForm: (open: boolean) => void
  editingCommitment: any
  setEditingCommitment: (commitment: any) => void
  onRefresh: () => void
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
  isEndSprintModalOpen,
  setIsEndSprintModalOpen,
  endingSprint,
  setEndingSprint,
  showCommitmentForm,
  setShowCommitmentForm,
  editingCommitment,
  setEditingCommitment,
  onRefresh,
}: ClientModalsProps) {
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
        onOpenChange={setIsGoalModalOpen}
        clientId={client.id}
        onSuccess={onRefresh}
      />

      <TargetFormModal
        open={isOutcomeModalOpen}
        onOpenChange={setIsOutcomeModalOpen}
        sprintId={sprints[0]?.id || ''}
        goals={goals.map((g: any) => ({ id: g.id, title: g.title }))}
        onSuccess={onRefresh}
      />

      <CommitmentForm
        open={showCommitmentForm}
        onOpenChange={open => {
          setShowCommitmentForm(open)
          if (!open) setEditingCommitment(null)
        }}
        onSubmit={async data => {
          if (editingCommitment) {
            await CommitmentService.updateCommitment(editingCommitment.id, data)
          } else {
            await CommitmentService.createCommitment(data)
          }
          setShowCommitmentForm(false)
          setEditingCommitment(null)
          onRefresh()
        }}
        commitment={editingCommitment}
        clientId={client.id}
      />
    </>
  )
}
