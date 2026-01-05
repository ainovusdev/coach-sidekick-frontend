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
import { Check, Target, CalendarIcon, User, Briefcase } from 'lucide-react'
import { useCreateCommitment } from '@/hooks/mutations/use-commitment-mutations'
import { SessionCommitmentsList } from './session-commitments-list'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

interface QuickCommitmentProps {
  sessionId: string
  clientId: string
}

export function QuickCommitment({ sessionId, clientId }: QuickCommitmentProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined)
  const [assigneeType, setAssigneeType] = useState<'client' | 'coach'>('client')
  const createCommitment = useCreateCommitment()

  const handleSave = () => {
    if (!title.trim()) return

    // Fire and forget - clear form immediately for optimistic UX
    const commitmentTitle = title.trim()
    const commitmentDate = targetDate
      ? format(targetDate, 'yyyy-MM-dd')
      : undefined
    const commitmentAssignee = assigneeType === 'coach' ? user?.id : undefined

    // Clear form immediately
    setTitle('')
    setTargetDate(undefined)
    setAssigneeType('client')

    createCommitment.mutate({
      client_id: clientId,
      session_id: sessionId,
      title: commitmentTitle,
      target_date: commitmentDate,
      type: 'action',
      priority: 'medium',
      assigned_to_id: commitmentAssignee,
    })
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-gray-900">
              Quick Commitment
            </h4>
            <Badge
              variant="secondary"
              className="text-xs bg-blue-100 text-blue-700"
            >
              Live
            </Badge>
          </div>

          {/* Assignee toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setAssigneeType('client')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                assigneeType === 'client'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-3 w-3" />
              Client
            </button>
            <button
              onClick={() => setAssigneeType('coach')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                assigneeType === 'coach'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Briefcase className="h-3 w-3" />
              Coach
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Input
              placeholder={
                assigneeType === 'client'
                  ? 'What will the client commit to?'
                  : 'What will you (coach) commit to?'
              }
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
            Quick capture - add details later
          </p>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Check className="h-3 w-3 mr-2" />
            Capture
          </Button>
        </div>
      </CardContent>

      {/* Session Commitments List */}
      <SessionCommitmentsList sessionId={sessionId} clientId={clientId} />
    </Card>
  )
}
