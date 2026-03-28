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
  const [editingOutcome, setEditingOutcome] = useState<any>(null)
  const [editingSprint, setEditingSprint] = useState<any>(null)
  const [showCommitmentCreatePanel, setShowCommitmentCreatePanel] =
    useState(false)
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
    editingOutcome,
    setEditingOutcome,
    editingSprint,
    setEditingSprint,
    showCommitmentCreatePanel,
    setShowCommitmentCreatePanel,
    endingSprint,
    setEndingSprint,
  }
}
