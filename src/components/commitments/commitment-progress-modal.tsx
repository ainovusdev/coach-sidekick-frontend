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
import { Commitment, CommitmentUpdateCreate } from '@/types/commitment'
import { TrendingUp } from 'lucide-react'

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
  const [note, setNote] = useState('')
  const [wins, setWins] = useState('')
  const [blockers, setBlockers] = useState('')

  React.useEffect(() => {
    if (open && commitment) {
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
              {loading ? 'Updating...' : 'Update Progress'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
