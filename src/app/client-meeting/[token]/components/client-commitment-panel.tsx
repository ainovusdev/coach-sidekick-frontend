/**
 * Client Commitment Panel
 * Allows clients to create and view commitments during the session
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Target, Plus, CheckCircle2, Circle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  LiveMeetingService,
  ClientCommitment,
} from '@/services/live-meeting-service'

interface ClientCommitmentPanelProps {
  meetingToken: string
  guestToken: string | null
  refreshKey?: number
}

export function ClientCommitmentPanel({
  meetingToken,
  guestToken,
  refreshKey,
}: ClientCommitmentPanelProps) {
  const [commitments, setCommitments] = useState<ClientCommitment[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Fetch commitments with polling
  useEffect(() => {
    if (!guestToken) return

    const fetchCommitments = async (showLoading = false) => {
      if (showLoading) setIsLoading(true)
      try {
        const data = await LiveMeetingService.getCommitments(
          meetingToken,
          guestToken,
        )
        setCommitments(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch commitments:', err)
      } finally {
        if (showLoading) setIsLoading(false)
      }
    }

    // Initial fetch with loading state
    fetchCommitments(true)

    // Poll every 30 seconds for updates (coach may add commitments)
    const interval = setInterval(() => fetchCommitments(false), 30000)

    return () => clearInterval(interval)
  }, [meetingToken, guestToken, refreshKey])

  const handleCreateCommitment = async () => {
    if (!newTitle.trim() || !guestToken) return

    setIsSaving(true)
    try {
      const commitment = await LiveMeetingService.createCommitment(
        meetingToken,
        guestToken,
        {
          title: newTitle.trim(),
          priority: 'medium',
          type: 'action',
        },
      )
      setCommitments([commitment, ...commitments])
      setNewTitle('')
      setShowForm(false)
      toast.success('Commitment added')
    } catch (err) {
      toast.error('Failed to create commitment')
      console.error('Failed to create commitment:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleComplete = async (commitment: ClientCommitment) => {
    if (!guestToken) return

    const newStatus = commitment.status === 'completed' ? 'active' : 'completed'
    const newProgress = newStatus === 'completed' ? 100 : 0

    try {
      const updated = await LiveMeetingService.updateCommitment(
        meetingToken,
        guestToken,
        commitment.id,
        {
          status: newStatus,
          progress_percentage: newProgress,
        },
      )
      setCommitments(
        commitments.map(c => (c.id === commitment.id ? updated : c)),
      )
    } catch (err) {
      toast.error('Failed to update commitment')
      console.error('Failed to update commitment:', err)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'medium':
        return 'bg-blue-100 text-blue-700'
      case 'low':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // Handle Enter to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCreateCommitment()
    }
    if (e.key === 'Escape') {
      setShowForm(false)
      setNewTitle('')
    }
  }

  return (
    <Card className="border-gray-200 h-full flex flex-col">
      <CardHeader className="border-b border-gray-100 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-gray-600" />
            My Commitments
          </CardTitle>
          {!showForm && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(true)}
              disabled={!guestToken}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* New Commitment Form */}
        {showForm && (
          <div className="flex-shrink-0 mb-4 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
            <Input
              placeholder="What do you commit to?"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-gray-200 mb-2"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  setNewTitle('')
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateCommitment}
                disabled={!newTitle.trim() || isSaving}
              >
                {isSaving ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        )}

        {/* Commitments List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">
              Loading commitments...
            </div>
          ) : !commitments || commitments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No commitments yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Add commitments to track your progress
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {commitments.map(commitment => (
                <div
                  key={commitment.id}
                  className={`p-3 rounded-lg border ${
                    commitment.status === 'completed'
                      ? 'border-green-200 bg-green-50/30'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleComplete(commitment)}
                      className="flex-shrink-0 mt-0.5"
                    >
                      {commitment.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          commitment.status === 'completed'
                            ? 'text-gray-500 line-through'
                            : 'text-gray-700'
                        }`}
                      >
                        {commitment.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getPriorityColor(commitment.priority)}`}
                        >
                          {commitment.priority}
                        </Badge>
                        {commitment.target_date && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(commitment.target_date), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
