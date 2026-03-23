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
      color: 'text-gray-600 dark:text-gray-400',
      bgColor:
        'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600',
      selectedColor:
        'bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-500',
    },
    {
      type: 'outcome' as const,
      icon: Zap,
      title: 'Coaching Outcome',
      description: 'Short-term win',
      color: 'text-blue-600',
      bgColor:
        'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-blue-300 dark:border-blue-700',
      selectedColor:
        'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600',
    },
    {
      type: 'sprint' as const,
      icon: Calendar,
      title: 'Sprint',
      description: '6-8 week timeboxed period',
      color: 'text-purple-600',
      bgColor:
        'bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border-purple-300 dark:border-purple-700',
      selectedColor:
        'bg-purple-100 dark:bg-purple-900/40 border-purple-400 dark:border-purple-600',
    },
    {
      type: 'commitment' as const,
      icon: CheckCircle2,
      title: 'Commitment',
      description: 'Actionable task or promise',
      color: 'text-green-600',
      bgColor:
        'bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border-green-300 dark:border-green-700',
      selectedColor:
        'bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600',
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
                    'flex-shrink-0 p-3 rounded-lg bg-white dark:bg-gray-900',
                    option.selectedColor,
                  )}
                >
                  <Icon className={cn('h-6 w-6', option.color)} />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {option.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
