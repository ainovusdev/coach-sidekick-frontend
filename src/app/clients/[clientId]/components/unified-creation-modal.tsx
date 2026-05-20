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

interface UnifiedCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  goals: any[]
  sprints: any[]
  onSuccess: () => void
  onCreateCommitment?: () => void
}

type EntityType = 'goal' | 'outcome' | 'sprint' | 'commitment' | null

export function UnifiedCreationModal({
  open,
  onOpenChange,
  clientId,
  goals,
  sprints,
  onSuccess,
  onCreateCommitment,
}: UnifiedCreationModalProps) {
  const [selectedType, setSelectedType] = useState<EntityType>(null)
  const [showForm, setShowForm] = useState(false)

  const handleTypeSelect = (type: EntityType) => {
    if (type === 'commitment') {
      // Delegate to parent's create panel instead of rendering CommitmentForm
      onOpenChange(false)
      setSelectedType(null)
      setShowForm(false)
      onCreateCommitment?.()
      return
    }
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
      title: 'Vision',
      description: 'Long-term outcome',
      color: 'text-ink-3 ',
      bgColor: 'bg-paper hover:bg-surface-3 border-line-strong ',
      selectedColor: 'bg-surface-3 border-line-strong ',
    },
    {
      type: 'outcome' as const,
      icon: Zap,
      title: 'Coaching Outcome',
      description: 'Short-term win',
      color: 'text-ds-accent',
      bgColor: 'bg-ds-accent-bg hover:bg-ds-accent-bg border-ds-accent ',
      selectedColor: 'bg-ds-accent-bg border-ds-accent ',
    },
    {
      type: 'sprint' as const,
      icon: Calendar,
      title: 'Sprint',
      description: '6-8 week timeboxed period',
      color: 'text-indigo',
      bgColor: 'bg-indigo-bg hover:bg-indigo-bg border-indigo ',
      selectedColor: 'bg-indigo-bg border-indigo ',
    },
    {
      type: 'commitment' as const,
      icon: CheckCircle2,
      title: 'Commitment',
      description: 'Actionable task or promise',
      color: 'text-forest',
      bgColor: 'bg-forest-bg hover:bg-forest-bg border-forest ',
      selectedColor: 'bg-forest-bg border-forest ',
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
          clientId={clientId}
          sprintId={sprints[0]?.id || ''}
          goals={goals.map((g: any) => ({ id: g.id, title: g.title }))}
          onSuccess={handleSuccess}
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
                    'flex-shrink-0 p-3 rounded-lg bg-surface-1 ',
                    option.selectedColor,
                  )}
                >
                  <Icon className={cn('h-6 w-6', option.color)} />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-ink mb-1">
                    {option.title}
                  </h4>
                  <p className="text-sm text-ink-3 ">{option.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
