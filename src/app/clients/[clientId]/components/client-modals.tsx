import ClientModal from '@/components/clients/client-modal'
import { ManualSessionModal } from '@/components/sessions/manual-session-modal'
import { ClientInvitationModal } from '@/components/clients/client-invitation-modal'
import { SprintFormModal } from '@/components/sprints/sprint-form-modal'
import { CommitmentForm } from '@/components/commitments/commitment-form'
import { CommitmentService } from '@/services/commitment-service'

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
  showCommitmentForm,
  setShowCommitmentForm,
  editingCommitment,
  setEditingCommitment,
  onRefresh,
}: ClientModalsProps) {
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
