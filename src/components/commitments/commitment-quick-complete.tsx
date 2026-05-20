'use client'

import { useState } from 'react'
import { Commitment } from '@/types/commitment'
import { CommitmentService } from '@/services/commitment-service'
import { CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CommitmentQuickCompleteProps {
  commitment: Commitment
  onComplete?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function CommitmentQuickComplete({
  commitment,
  onComplete,
  size = 'md',
}: CommitmentQuickCompleteProps) {
  const [updating, setUpdating] = useState(false)
  const isComplete = commitment.status === 'completed'

  const handleToggle = async () => {
    setUpdating(true)
    try {
      if (isComplete) {
        // Uncomplete: set back to active
        await CommitmentService.updateCommitment(commitment.id, {
          status: 'active',
          progress_percentage: 0,
        })
        toast.success('Marked as Incomplete')
      } else {
        // Mark complete
        await CommitmentService.updateProgress(commitment.id, {
          progress_percentage: 100,
          note: 'Marked as complete',
        })
        toast.success('Commitment Completed! 🎉', {
          description: 'Great work on completing this commitment',
        })
      }
      onComplete?.()
    } catch (error) {
      console.error('Failed to update commitment:', error)
    } finally {
      setUpdating(false)
    }
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  if (updating) {
    return (
      <Loader2 className={`${sizeClasses[size]} animate-spin text-ink-4`} />
    )
  }

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
      disabled={updating}
    >
      {isComplete ? (
        <CheckCircle
          className={`${sizeClasses[size]} text-forest fill-forest`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-line-strong hover:border-line-strong transition-colors`}
        />
      )}
    </button>
  )
}
