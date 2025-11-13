import { useState } from 'react'

export function useClientModals() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isManualSessionModalOpen, setIsManualSessionModalOpen] =
    useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false)
  const [isStartSessionModalOpen, setIsStartSessionModalOpen] = useState(false)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false)
  const [isUnifiedCreateModalOpen, setIsUnifiedCreateModalOpen] =
    useState(false)
  const [isEndSprintModalOpen, setIsEndSprintModalOpen] = useState(false)
  const [showPersona, setShowPersona] = useState(false)
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [editingCommitment, setEditingCommitment] = useState<any>(null)
  const [showCommitmentForm, setShowCommitmentForm] = useState(false)
  const [endingSprint, setEndingSprint] = useState<any>(null)

  return {
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
    showPersona,
    setShowPersona,
    selectedTargetId,
    setSelectedTargetId,
    editingGoal,
    setEditingGoal,
    editingCommitment,
    setEditingCommitment,
    showCommitmentForm,
    setShowCommitmentForm,
    endingSprint,
    setEndingSprint,
  }
}
