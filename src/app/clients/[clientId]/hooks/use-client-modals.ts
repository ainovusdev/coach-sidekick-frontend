import { useState } from 'react'

export function useClientModals() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isManualSessionModalOpen, setIsManualSessionModalOpen] =
    useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false)
  const [showPersona, setShowPersona] = useState(false)
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const [editingCommitment, setEditingCommitment] = useState<any>(null)
  const [showCommitmentForm, setShowCommitmentForm] = useState(false)

  return {
    isEditModalOpen,
    setIsEditModalOpen,
    isManualSessionModalOpen,
    setIsManualSessionModalOpen,
    isInviteModalOpen,
    setIsInviteModalOpen,
    isSprintModalOpen,
    setIsSprintModalOpen,
    showPersona,
    setShowPersona,
    selectedTargetId,
    setSelectedTargetId,
    editingCommitment,
    setEditingCommitment,
    showCommitmentForm,
    setShowCommitmentForm,
  }
}
