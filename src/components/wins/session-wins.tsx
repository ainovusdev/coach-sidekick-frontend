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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      <div className="border border-app-border rounded-lg overflow-hidden bg-app-surface">
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 p-0.5 hover:bg-app-border rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-app-secondary" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-app-secondary" />
              )}
            </button>
            <p className="text-sm font-medium flex-1 text-app-primary truncate">
              {win.title}
            </p>
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse flex-shrink-0" />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              onClick={() => onApprove(win.id)}
              size="sm"
              variant="ghost"
              disabled={isApproving || isDeleting}
              className="h-7 px-2 text-app-secondary hover:text-app-primary"
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
              variant="ghost"
              disabled={isApproving || isDeleting}
              className="h-7 px-2 text-app-secondary hover:text-app-secondary"
              title="Edit win"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => onDelete(win.id)}
              size="sm"
              variant="ghost"
              disabled={isApproving || isDeleting}
              className="h-7 px-2 text-app-secondary hover:text-red-600"
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
          <div className="px-3 pb-3 pt-1 border-t border-app-border">
            <p className="text-sm text-app-secondary pl-6">{win.description}</p>
          </div>
        )}
      </div>
    )
  }

  // Approved win
  return (
    <div className="border border-app-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-2 p-3 hover:bg-app-surface transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-0.5 hover:bg-app-border rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-app-secondary" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-app-secondary" />
            )}
          </button>
          <p className="text-sm font-medium flex-1 text-app-primary truncate">
            {win.title}
          </p>
          {win.is_ai_generated && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="w-1 h-1 bg-app-secondary rounded-full" />
              <span className="text-xs text-app-secondary">AI</span>
            </div>
          )}
        </div>
        {!isViewer && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              onClick={() => onEdit(win)}
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-app-secondary hover:text-app-secondary"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => onDelete(win.id)}
              size="sm"
              variant="ghost"
              disabled={isDeleting}
              className="h-7 px-2 text-app-secondary hover:text-red-600"
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
        <div className="px-3 pb-3 pt-1 border-t border-app-border bg-app-surface">
          <p className="text-sm text-app-secondary pl-6">{win.description}</p>
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

  const approvedWins = wins.filter(w => w.is_approved)
  const pendingWins = wins.filter(w => !w.is_approved && w.is_ai_generated)

  return (
    <Card className="border-app-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-app-secondary" />
            <h3 className="text-sm font-semibold text-app-primary">
              Session Wins
            </h3>
            {wins.length > 0 && (
              <span className="text-xs text-app-secondary">
                ({wins.length})
              </span>
            )}
          </div>
          {!isViewer && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExtractWins}
                disabled={extracting}
                variant="ghost"
                size="sm"
                className="text-xs text-app-secondary hover:text-app-primary"
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    Extract
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                size="sm"
                className="bg-app-primary hover:bg-app-primary/90 text-white text-xs"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Add
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-app-secondary" />
          </div>
        ) : wins.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-app-surface rounded-lg mb-3">
              <Trophy className="h-5 w-5 text-app-secondary" />
            </div>
            <p className="text-sm text-app-secondary">
              {isViewer ? 'No wins recorded.' : 'No wins yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending AI-generated wins */}
            {pendingWins.length > 0 && !isViewer && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-app-secondary uppercase tracking-wide">
                    Pending ({pendingWins.length})
                  </span>
                </div>
                <div className="space-y-2">
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
              </div>
            )}

            {/* Approved wins */}
            {approvedWins.length > 0 && (
              <div className="space-y-2">
                {pendingWins.length > 0 && !isViewer && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <span className="text-xs font-medium text-app-secondary uppercase tracking-wide">
                      Confirmed ({approvedWins.length})
                    </span>
                  </div>
                )}
                <div className="space-y-2">
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
              <label className="text-sm font-medium text-app-primary mb-1.5 block">
                Title *
              </label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g., Achieved 90-day fitness goal"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-app-primary mb-1.5 block">
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
              className="bg-black hover:bg-app-primary/90"
            >
              {editingWin ? 'Update Win' : 'Add Win'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
