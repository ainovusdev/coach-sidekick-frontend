'use client'

import React, { useState, useEffect } from 'react'
import {
  Trophy,
  Sparkles,
  Loader2,
  Plus,
  Check,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { WinsService } from '@/services/wins-service'
import { SessionWin, SessionWinCreate } from '@/types/win'
import { toast } from 'sonner'

interface WinItemProps {
  win: SessionWin
  isPending: boolean
  isViewer: boolean
  onApprove: (winId: string) => void
  onEdit: (win: SessionWin) => void
  onDelete: (winId: string) => void
  isApproving: boolean
  isDeleting: boolean
}

function WinItem({
  win,
  isPending,
  isViewer,
  onApprove,
  onEdit,
  onDelete,
  isApproving,
  isDeleting,
}: WinItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (isPending) {
    return (
      <div className="border border-amber-200 rounded-lg overflow-hidden bg-amber-50">
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <Trophy className="h-4 w-4 text-amber-600" />
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 p-0.5 hover:bg-amber-100 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-amber-700" />
              ) : (
                <ChevronRight className="h-4 w-4 text-amber-700" />
              )}
            </button>
            <p className="text-sm font-medium flex-1 text-gray-900 truncate">
              {win.title}
            </p>
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-700 border-amber-200 text-xs flex-shrink-0"
            >
              Pending
            </Badge>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              onClick={() => onApprove(win.id)}
              size="sm"
              variant="outline"
              disabled={isApproving || isDeleting}
              className="h-7 px-2 border-green-500 text-green-600 hover:bg-green-50"
              title="Approve win"
            >
              {isApproving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              onClick={() => onEdit(win)}
              size="sm"
              variant="outline"
              disabled={isApproving || isDeleting}
              className="h-7 px-2"
              title="Edit win"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => onDelete(win.id)}
              size="sm"
              variant="outline"
              disabled={isApproving || isDeleting}
              className="h-7 px-2 border-red-300 text-red-600 hover:bg-red-50"
              title="Reject win"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
        {isExpanded && win.description && (
          <div className="px-3 pb-3 pt-1 border-t border-amber-200 bg-amber-50/50">
            <p className="text-sm text-gray-600 pl-7">{win.description}</p>
          </div>
        )}
      </div>
    )
  }

  // Approved win
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-2 p-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
          </button>
          <p className="text-sm font-medium flex-1 text-gray-900 truncate">
            {win.title}
          </p>
          {win.is_ai_generated && (
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-500 text-xs flex-shrink-0"
            >
              AI
            </Badge>
          )}
        </div>
        {!isViewer && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              onClick={() => onEdit(win)}
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-gray-400 hover:text-gray-600"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => onDelete(win.id)}
              size="sm"
              variant="ghost"
              disabled={isDeleting}
              className="h-7 px-2 text-gray-400 hover:text-red-600"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        )}
      </div>
      {isExpanded && win.description && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-600 pl-7">{win.description}</p>
        </div>
      )}
    </div>
  )
}

interface SessionWinsProps {
  sessionId: string
  clientId: string
  isViewer?: boolean
}

export function SessionWins({
  sessionId,
  clientId,
  isViewer = false,
}: SessionWinsProps) {
  const [wins, setWins] = useState<SessionWin[]>([])
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingWin, setEditingWin] = useState<SessionWin | null>(null)
  const [approvingWinId, setApprovingWinId] = useState<string | null>(null)
  const [deletingWinId, setDeletingWinId] = useState<string | null>(null)

  // Form state
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')

  // Load wins
  const loadWins = async () => {
    try {
      const response = await WinsService.getSessionWins(sessionId)
      setWins(response.wins)
    } catch (error) {
      console.error('Failed to load wins:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWins()
  }, [sessionId])

  // Extract wins using AI
  const handleExtractWins = async () => {
    setExtracting(true)
    try {
      const response = await WinsService.extractWins(sessionId)
      toast.success(
        `Found ${response.created_wins.length} wins from the session`,
      )
      await loadWins()
    } catch (error) {
      console.error('Failed to extract wins:', error)
      toast.error('Failed to extract wins')
    } finally {
      setExtracting(false)
    }
  }

  // Create a new win
  const handleCreateWin = async () => {
    if (!newTitle.trim()) return

    try {
      const data: SessionWinCreate = {
        session_id: sessionId,
        client_id: clientId,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        is_ai_generated: false,
      }
      await WinsService.createWin(data)
      toast.success('Win added successfully')
      setShowCreateDialog(false)
      setNewTitle('')
      setNewDescription('')
      await loadWins()
    } catch (error) {
      console.error('Failed to create win:', error)
      toast.error('Failed to create win')
    }
  }

  // Update a win
  const handleUpdateWin = async () => {
    if (!editingWin || !newTitle.trim()) return

    try {
      await WinsService.updateWin(editingWin.id, sessionId, {
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      })
      toast.success('Win updated successfully')
      setEditingWin(null)
      setNewTitle('')
      setNewDescription('')
      await loadWins()
    } catch (error) {
      console.error('Failed to update win:', error)
      toast.error('Failed to update win')
    }
  }

  // Approve an AI-generated win
  const handleApproveWin = async (winId: string) => {
    setApprovingWinId(winId)
    try {
      await WinsService.approveWin(winId, sessionId)
      toast.success('Win approved')
      await loadWins()
    } catch (error) {
      console.error('Failed to approve win:', error)
      toast.error('Failed to approve win')
    } finally {
      setApprovingWinId(null)
    }
  }

  // Delete a win
  const handleDeleteWin = async (winId: string) => {
    setDeletingWinId(winId)
    try {
      await WinsService.deleteWin(winId, sessionId)
      toast.success('Win removed')
      await loadWins()
    } catch (error) {
      console.error('Failed to delete win:', error)
      toast.error('Failed to delete win')
    } finally {
      setDeletingWinId(null)
    }
  }

  // Open edit dialog
  const openEditDialog = (win: SessionWin) => {
    setEditingWin(win)
    setNewTitle(win.title)
    setNewDescription(win.description || '')
  }

  if (loading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const approvedWins = wins.filter(w => w.is_approved)
  const pendingWins = wins.filter(w => !w.is_approved && w.is_ai_generated)

  return (
    <Card className="border-gray-200 shadow-sm">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-lg font-semibold text-black">Session Wins</h3>
              <p className="text-xs text-gray-500">
                Achievements and breakthroughs from this session
              </p>
            </div>
          </div>
          {!isViewer && (
            <div className="flex gap-2">
              <Button
                onClick={handleExtractWins}
                disabled={extracting}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50 hover:border-black"
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Extract Wins
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                size="sm"
                className="bg-black hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Win
              </Button>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-6">
        {wins.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No wins recorded yet</p>
            <p className="text-sm text-gray-500 mt-1">
              {isViewer
                ? 'No wins have been recorded for this session.'
                : 'Extract wins from AI analysis or add them manually'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending AI-generated wins */}
            {pendingWins.length > 0 && !isViewer && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700"
                  >
                    Pending Review
                  </Badge>
                  <span className="text-xs text-gray-500">
                    AI-extracted wins need your approval
                  </span>
                </div>
                {pendingWins.map(win => (
                  <WinItem
                    key={win.id}
                    win={win}
                    isPending={true}
                    isViewer={isViewer}
                    onApprove={handleApproveWin}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteWin}
                    isApproving={approvingWinId === win.id}
                    isDeleting={deletingWinId === win.id}
                  />
                ))}
              </div>
            )}

            {/* Approved wins */}
            {approvedWins.length > 0 && (
              <div className="space-y-2">
                {pendingWins.length > 0 && !isViewer && (
                  <div className="text-xs font-medium text-gray-500 mt-4 mb-2">
                    Approved Wins
                  </div>
                )}
                {approvedWins.map(win => (
                  <WinItem
                    key={win.id}
                    win={win}
                    isPending={false}
                    isViewer={isViewer}
                    onApprove={handleApproveWin}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteWin}
                    isApproving={approvingWinId === win.id}
                    isDeleting={deletingWinId === win.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingWin}
        onOpenChange={open => {
          if (!open) {
            setShowCreateDialog(false)
            setEditingWin(null)
            setNewTitle('')
            setNewDescription('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWin ? 'Edit Win' : 'Add New Win'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Title *
              </label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g., Achieved 90-day fitness goal"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Description
              </label>
              <Textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Describe the achievement and its significance..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setEditingWin(null)
                setNewTitle('')
                setNewDescription('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingWin ? handleUpdateWin : handleCreateWin}
              disabled={!newTitle.trim()}
              className="bg-black hover:bg-gray-800"
            >
              {editingWin ? 'Update Win' : 'Add Win'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
