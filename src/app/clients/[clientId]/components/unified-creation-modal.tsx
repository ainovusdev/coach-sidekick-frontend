'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Target, Zap, CheckCircle2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GoalFormModal } from '@/components/goals/goal-form-modal'
import { TargetFormModal } from '@/components/sprints/target-form-modal'
import { SprintFormModal } from '@/components/sprints/sprint-form-modal'
import { CommitmentForm } from '@/components/commitments/commitment-form'
import { CommitmentService } from '@/services/commitment-service'

interface UnifiedCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  goals: any[]
  sprints: any[]
  onSuccess: () => void
}

type EntityType = 'goal' | 'outcome' | 'sprint' | 'commitment' | null

export function UnifiedCreationModal({
  open,
  onOpenChange,
  clientId,
  goals,
  sprints,
  onSuccess,
}: UnifiedCreationModalProps) {
  const [selectedType, setSelectedType] = useState<EntityType>(null)
  const [showForm, setShowForm] = useState(false)

  const handleTypeSelect = (type: EntityType) => {
    setSelectedType(type)
    setShowForm(true)
  }

  const handleClose = () => {
    setSelectedType(null)
    setShowForm(false)
    onOpenChange(false)
  }

  const handleSuccess = () => {
    setSelectedType(null)
    setShowForm(false)
    onSuccess()
    onOpenChange(false)
  }

  const entityOptions = [
    {
      type: 'goal' as const,
      icon: Target,
      title: 'Goal',
      description: 'Long-term outcome (3-12 months)',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100 border-gray-300',
      selectedColor: 'bg-gray-100 border-gray-400',
    },
    {
      type: 'sprint' as const,
      icon: Calendar,
      title: 'Sprint',
      description: '6-8 week timeboxed period',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-300',
      selectedColor: 'bg-purple-100 border-purple-400',
    },
    {
      type: 'outcome' as const,
      icon: Zap,
      title: 'Outcome',
      description: 'Short-term win (within a sprint)',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-300',
      selectedColor: 'bg-blue-100 border-blue-400',
    },
    {
      type: 'commitment' as const,
      icon: CheckCircle2,
      title: 'Commitment',
      description: 'Actionable task or promise',
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100 border-green-300',
      selectedColor: 'bg-green-100 border-green-400',
    },
  ]

  // If form is shown, render the appropriate modal
  if (showForm && selectedType) {
    if (selectedType === 'goal') {
      return (
        <GoalFormModal
          open={true}
          onOpenChange={open => {
            if (!open) handleClose()
          }}
          clientId={clientId}
          onSuccess={handleSuccess}
        />
      )
    }

    if (selectedType === 'sprint') {
      return (
        <SprintFormModal
          open={true}
          onOpenChange={open => {
            if (!open) handleClose()
          }}
          clientId={clientId}
          onSuccess={handleSuccess}
        />
      )
    }

    if (selectedType === 'outcome') {
      return (
        <TargetFormModal
          open={true}
          onOpenChange={open => {
            if (!open) handleClose()
          }}
          sprintId={sprints[0]?.id || ''}
          goals={goals.map((g: any) => ({ id: g.id, title: g.title }))}
          onSuccess={handleSuccess}
        />
      )
    }

    if (selectedType === 'commitment') {
      return (
        <CommitmentForm
          open={true}
          onOpenChange={open => {
            if (!open) handleClose()
          }}
          onSubmit={async data => {
            await CommitmentService.createCommitment(data)
            handleSuccess()
          }}
          clientId={clientId}
        />
      )
    }
  }

  // Show type selector
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New</DialogTitle>
          <DialogDescription>What would you like to create?</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 py-4">
          {entityOptions.map(option => {
            const Icon = option.icon
            return (
              <button
                key={option.type}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left',
                  option.bgColor,
                )}
                onClick={() => handleTypeSelect(option.type)}
              >
                <div
                  className={cn(
                    'flex-shrink-0 p-3 rounded-lg bg-white',
                    option.selectedColor,
                  )}
                >
                  <Icon className={cn('h-6 w-6', option.color)} />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 mb-1">
                    {option.title}
                  </h4>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
