'use client'

import React, { useState, useEffect } from 'react'
import {
  Trophy,
  Sparkles,
  Loader2,
  Plus,
  Check,
  X,
  Pencil,
  Trash2,
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
import { toast } from '@/hooks/use-toast'

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
      toast({
        title: 'Wins Extracted',
        description: `Found ${response.created_wins.length} wins from the session.`,
      })
      await loadWins()
    } catch (error) {
      console.error('Failed to extract wins:', error)
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
      toast({
        title: 'Win Created',
        description: 'The win has been added successfully.',
      })
      setShowCreateDialog(false)
      setNewTitle('')
      setNewDescription('')
      await loadWins()
    } catch (error) {
      console.error('Failed to create win:', error)
    }
  }

  // Update a win
  const handleUpdateWin = async () => {
    if (!editingWin || !newTitle.trim()) return

    try {
      await WinsService.updateWin(editingWin.id, {
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      })
      toast({
        title: 'Win Updated',
        description: 'The win has been updated successfully.',
      })
      setEditingWin(null)
      setNewTitle('')
      setNewDescription('')
      await loadWins()
    } catch (error) {
      console.error('Failed to update win:', error)
    }
  }

  // Approve an AI-generated win
  const handleApproveWin = async (winId: string) => {
    try {
      await WinsService.approveWin(winId)
      toast({
        title: 'Win Approved',
        description: 'The win has been approved.',
      })
      await loadWins()
    } catch (error) {
      console.error('Failed to approve win:', error)
    }
  }

  // Delete a win
  const handleDeleteWin = async (winId: string) => {
    try {
      await WinsService.deleteWin(winId)
      toast({
        title: 'Win Deleted',
        description: 'The win has been removed.',
      })
      await loadWins()
    } catch (error) {
      console.error('Failed to delete win:', error)
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
        {/* Pending AI-generated wins */}
        {pendingWins.length > 0 && !isViewer && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700"
              >
                Pending Review
              </Badge>
              <span className="text-gray-400 font-normal">
                AI-extracted wins need your approval
              </span>
            </h4>
            <div className="space-y-3">
              {pendingWins.map(win => (
                <div
                  key={win.id}
                  className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{win.title}</h5>
                      {win.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {win.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveWin(win.id)}
                        size="sm"
                        variant="outline"
                        className="border-green-500 text-green-600 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => openEditDialog(win)}
                        size="sm"
                        variant="outline"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteWin(win.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved wins */}
        {approvedWins.length > 0 ? (
          <div className="space-y-3">
            {approvedWins.map(win => (
              <div
                key={win.id}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Trophy className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{win.title}</h5>
                      {win.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {win.description}
                        </p>
                      )}
                      {win.is_ai_generated && (
                        <Badge
                          variant="secondary"
                          className="mt-2 bg-gray-100 text-gray-500 text-xs"
                        >
                          AI-generated
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!isViewer && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => openEditDialog(win)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteWin(win.id)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : pendingWins.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No wins recorded yet</p>
            <p className="text-sm text-gray-500">
              {isViewer
                ? 'No wins have been recorded for this session.'
                : 'Extract wins from AI analysis or add them manually'}
            </p>
          </div>
        ) : null}
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
