'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Commitment, CommitmentUpdateCreate } from '@/types/commitment'
import { TrendingUp, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommitmentProgressModalProps {
  commitment: Commitment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CommitmentUpdateCreate) => Promise<void>
}

export function CommitmentProgressModal({
  commitment,
  open,
  onOpenChange,
  onSubmit,
}: CommitmentProgressModalProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(commitment?.progress_percentage || 0)
  const [note, setNote] = useState('')
  const [wins, setWins] = useState('')
  const [blockers, setBlockers] = useState('')

  React.useEffect(() => {
    if (open && commitment) {
      setProgress(commitment.progress_percentage)
      setNote('')
      setWins('')
      setBlockers('')
    }
  }, [open, commitment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        progress_percentage: progress,
        note: note || undefined,
        wins: wins || undefined,
        blockers: blockers || undefined,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!commitment) return null

  const isCompleting = progress === 100 && commitment.progress_percentage < 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Update Progress
          </DialogTitle>
          <DialogDescription>{commitment.title}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Progress Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Progress</Label>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-2xl font-bold',
                    isCompleting && 'text-green-600 animate-pulse',
                  )}
                >
                  {progress}%
                </span>
                {isCompleting && (
                  <PartyPopper className="size-5 text-green-600" />
                )}
              </div>
            </div>
            <Slider
              value={[progress]}
              onValueChange={values => setProgress(values[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Not Started</span>
              <span>In Progress</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Completion Message */}
          {isCompleting && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm font-medium text-green-700">
                Congratulations! You&apos;re marking this commitment as
                complete!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Share your wins and key learnings below.
              </p>
            </div>
          )}

          {/* Update Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Progress Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What have you been working on?"
              rows={3}
            />
          </div>

          {/* Wins */}
          <div className="space-y-2">
            <Label htmlFor="wins">Wins & Achievements</Label>
            <Textarea
              id="wins"
              value={wins}
              onChange={e => setWins(e.target.value)}
              placeholder="What's going well? What are you proud of?"
              rows={3}
            />
          </div>

          {/* Blockers */}
          <div className="space-y-2">
            <Label htmlFor="blockers">Challenges & Blockers</Label>
            <Textarea
              id="blockers"
              value={blockers}
              onChange={e => setBlockers(e.target.value)}
              placeholder="What's getting in the way? What support do you need?"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Updating...'
                : isCompleting
                  ? 'Complete Commitment'
                  : 'Update Progress'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
