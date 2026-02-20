'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Commitment } from '@/types/commitment'
import {
  ClientCommitmentCreate,
  ClientCommitmentUpdate,
} from '@/services/client-commitment-service'
import { useClientOutcomes } from '@/hooks/queries/use-client-outcomes'
import {
  Calendar,
  Zap,
  RefreshCw,
  Trophy,
  BookOpen,
  Target,
  CheckCircle2,
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { formatDate } from '@/lib/date-utils'

interface ClientCommitmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    data: ClientCommitmentCreate | ClientCommitmentUpdate,
  ) => Promise<void>
  commitment?: Commitment | null
}

const typeOptions = [
  {
    value: 'action',
    label: 'Action',
    icon: Zap,
    description: 'One-time task to complete',
  },
  {
    value: 'habit',
    label: 'Habit',
    icon: RefreshCw,
    description: 'Recurring behavior to build',
  },
  {
    value: 'milestone',
    label: 'Milestone',
    icon: Trophy,
    description: 'Major achievement to reach',
  },
  {
    value: 'learning',
    label: 'Learning',
    icon: BookOpen,
    description: 'Skill or knowledge to acquire',
  },
]

// Quick date presets
const datePresets = [
  { label: 'Tomorrow', days: 1 },
  { label: 'This Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
]

export function ClientCommitmentForm({
  open,
  onOpenChange,
  onSubmit,
  commitment,
}: ClientCommitmentFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([])
  const { data: outcomes } = useClientOutcomes({ status: 'active' })
  const [formData, setFormData] = useState<ClientCommitmentCreate>({
    title: '',
    description: '',
    type: 'action',
    target_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'), // Default to 1 week
  })

  // Reset form when dialog opens/closes or commitment changes
  useEffect(() => {
    if (open) {
      if (commitment) {
        setFormData({
          title: commitment.title,
          description: commitment.description || '',
          type: commitment.type as any,
          target_date:
            commitment.target_date ||
            format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        })
        setSelectedTargetIds(commitment.linked_target_ids || [])
      } else {
        setFormData({
          title: '',
          description: '',
          type: 'action',
          target_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        })
        setSelectedTargetIds([])
      }
    }
  }, [open, commitment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.target_date) {
      return // Target date is required
    }

    setLoading(true)

    try {
      const submitData = {
        ...formData,
        target_ids:
          selectedTargetIds.length > 0 ? selectedTargetIds : undefined,
      }
      await onSubmit(submitData)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save commitment:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateField = <K extends keyof ClientCommitmentCreate>(
    field: K,
    value: ClientCommitmentCreate[K],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const setDatePreset = (days: number) => {
    const date = addDays(new Date(), days)
    updateField('target_date', format(date, 'yyyy-MM-dd'))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {commitment ? 'Edit Commitment' : 'New Commitment'}
          </DialogTitle>
          <DialogDescription>
            {commitment
              ? 'Update your commitment details'
              : 'What will you commit to achieving?'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              What do you want to commit to?{' '}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => updateField('title', e.target.value)}
              placeholder="e.g., Complete the leadership course"
              required
              maxLength={200}
              className="h-11"
            />
          </div>

          {/* Target Date - PROMINENT */}
          <div className="space-y-3">
            <Label
              htmlFor="target_date"
              className="text-sm font-medium flex items-center gap-2"
            >
              <Calendar className="h-4 w-4 text-gray-500" />
              When will you complete this?{' '}
              <span className="text-red-500">*</span>
            </Label>

            {/* Date Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              {datePresets.map(preset => {
                const presetDate = format(
                  addDays(new Date(), preset.days),
                  'yyyy-MM-dd',
                )
                const isSelected = formData.target_date === presetDate
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDatePreset(preset.days)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            {/* Date Input */}
            <div className="relative">
              <Input
                id="target_date"
                type="date"
                value={formData.target_date || ''}
                onChange={e => updateField('target_date', e.target.value)}
                required
                min={format(new Date(), 'yyyy-MM-dd')}
                className="h-12 text-base pl-4 pr-4 bg-gray-50 border-gray-200 font-medium"
              />
            </div>

            {/* Selected date display */}
            {formData.target_date && (
              <p className="text-sm text-gray-600">
                Target:{' '}
                <span className="font-medium text-gray-900">
                  {formatDate(formData.target_date, 'EEEE, MMMM d, yyyy')}
                </span>
              </p>
            )}
          </div>

          {/* Link to Outcome (optional) */}
          {outcomes && outcomes.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" />
                Link to Outcome{' '}
                <span className="text-gray-400">(optional)</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {outcomes.map(outcome => {
                  const isSelected = selectedTargetIds.includes(outcome.id)
                  return (
                    <button
                      key={outcome.id}
                      type="button"
                      onClick={() =>
                        setSelectedTargetIds(prev =>
                          isSelected
                            ? prev.filter(id => id !== outcome.id)
                            : [...prev, outcome.id],
                        )
                      }
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={
                        outcome.goal_titles.length > 0
                          ? `Vision: ${outcome.goal_titles.join(', ')}`
                          : undefined
                      }
                    >
                      {isSelected && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {outcome.title}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Commitment Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Type of Commitment</Label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map(option => {
                const Icon = option.icon
                const isSelected = formData.type === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField('type', option.value as any)}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description - Optional */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium text-gray-600"
            >
              Additional Details{' '}
              <span className="text-gray-400">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              placeholder="Add any context or notes..."
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title || !formData.target_date}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {loading
                ? 'Saving...'
                : commitment
                  ? 'Update Commitment'
                  : 'Create Commitment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
