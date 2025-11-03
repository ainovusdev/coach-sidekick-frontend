'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Check, Loader2, Target, CalendarIcon } from 'lucide-react'
import { CommitmentService } from '@/services/commitment-service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface QuickCommitmentProps {
  sessionId: string
  clientId: string
}

export function QuickCommitment({ sessionId, clientId }: QuickCommitmentProps) {
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim() || saving) return

    setSaving(true)
    try {
      await CommitmentService.createCommitment({
        client_id: clientId,
        session_id: sessionId,
        title: title.trim(),
        target_date: targetDate ? format(targetDate, 'yyyy-MM-dd') : undefined,
        type: 'action', // Default to action
        priority: 'medium', // Default to medium
      })

      toast.success('Commitment Saved', {
        description: 'You can add more details after the session',
      })

      setTitle('') // Clear after save
      setTargetDate(undefined)
    } catch (error) {
      toast.error('Failed to Save Commitment', {
        description:
          error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-gray-900">
              Quick Commitment (Live Session)
            </h4>
            <Badge
              variant="secondary"
              className="text-xs bg-blue-100 text-blue-700"
            >
              Active
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Input
              placeholder="What will the client commit to?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => {
                // Save on Cmd/Ctrl + Enter
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault()
                  handleSave()
                }
              }}
              className="border-gray-200 focus:border-blue-400 text-base h-11"
              disabled={saving}
              maxLength={200}
            />
          </div>

          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-9 border-gray-200',
                    !targetDate && 'text-muted-foreground',
                  )}
                  disabled={saving}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetDate ? (
                    format(targetDate, 'PPP')
                  ) : (
                    <span>Pick due date (optional)</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={setTargetDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-500">
            💡 Quick capture - add details later
          </p>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-3 w-3 mr-2" />
                Capture
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
