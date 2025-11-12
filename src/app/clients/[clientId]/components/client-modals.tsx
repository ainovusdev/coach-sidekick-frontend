import ClientModal from '@/components/clients/client-modal'
import { ManualSessionModal } from '@/components/sessions/manual-session-modal'
import { ClientInvitationModal } from '@/components/clients/client-invitation-modal'
import { SprintFormModal } from '@/components/sprints/sprint-form-modal'
import { EndSprintModal } from './end-sprint-modal'
import { CommitmentForm } from '@/components/commitments/commitment-form'
import { StartSessionModal } from './start-session-modal'
import { GoalFormModal } from '@/components/goals/goal-form-modal'
import { CommitmentService } from '@/services/commitment-service'
import { useSprints } from '@/hooks/queries/use-sprints'
import { useCommitments } from '@/hooks/queries/use-commitments'

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
  isEndSprintModalOpen: boolean
  setIsEndSprintModalOpen: (open: boolean) => void
  endingSprint: any
  setEndingSprint: (sprint: any) => void
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
  // Check for active sprints
  const { data: activeSprints } = useSprints({
    client_id: client.id,
    status: 'active',
  })

  const sprintsArray = activeSprints || []
  const hasActiveSprint = sprintsArray.length > 0
  const currentSprint = sprintsArray[0] // Get the first active sprint

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
        hasActiveSprint={hasActiveSprint}
        activeSprintTitle={currentSprint?.title || ''}
        onEndCurrentSprint={() => {
          if (currentSprint) {
            setEndingSprint(currentSprint)
            setIsEndSprintModalOpen(true)
          }
        }}
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
