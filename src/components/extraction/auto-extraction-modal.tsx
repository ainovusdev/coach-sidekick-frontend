/**
 * Auto-Extraction Modal
 * Shows after session ends with suggested commitments and wins
 * Max 4 suggestions with accept/reject/edit capabilities
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sparkles,
  Target,
  Trophy,
  Check,
  X,
  Pencil,
  Loader2,
  ChevronRight,
  CheckCheck,
  XCircle,
  CalendarIcon,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { WinsService } from '@/services/wins-service'
import { CommitmentService } from '@/services/commitment-service'
import type { ExtractedWin } from '@/types/win'
import type { ExtractedCommitment } from '@/types/commitment'
import { format, addWeeks } from 'date-fns'

interface AutoExtractionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  clientId: string
  onComplete?: () => void
}

type ItemType = 'commitment' | 'win'

interface SuggestionItem {
  id: string
  type: ItemType
  title: string
  description?: string
  confidence?: number
  status: 'pending' | 'accepted' | 'rejected' | 'editing'
  target_date?: Date // For commitments
}

export function AutoExtractionModal({
  open,
  onOpenChange,
  sessionId,
  clientId,
  onComplete,
}: AutoExtractionModalProps) {
  const [_isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTargetDate, setEditTargetDate] = useState<Date | undefined>(
    undefined,
  )
  const [step, setStep] = useState<'loading' | 'review' | 'complete'>('loading')

  // Extract suggestions when modal opens
  useEffect(() => {
    if (open && step === 'loading') {
      extractSuggestions()
    }
  }, [open])

  const extractSuggestions = async () => {
    setIsLoading(true)
    try {
      // Extract both wins and commitments in parallel
      const [winsResult, commitmentsResult] = await Promise.all([
        WinsService.extractWins(sessionId).catch(() => ({
          extracted_wins: [],
        })),
        CommitmentService.extractFromSession(sessionId).catch(() => []),
      ])

      const allSuggestions: SuggestionItem[] = []

      // Add wins (max 2)
      const extractedWins =
        (winsResult as { extracted_wins?: ExtractedWin[] }).extracted_wins || []
      extractedWins.slice(0, 2).forEach((win, idx) => {
        allSuggestions.push({
          id: `win-${idx}`,
          type: 'win',
          title: win.title,
          description: win.description,
          confidence: win.confidence,
          status: 'pending',
        })
      })

      // Add commitments (max 2)
      const extractedCommitments: ExtractedCommitment[] = Array.isArray(
        commitmentsResult,
      )
        ? commitmentsResult
        : []
      // Default target date is 2 weeks from now
      const defaultTargetDate = addWeeks(new Date(), 2)
      extractedCommitments.slice(0, 2).forEach((commitment, idx) => {
        allSuggestions.push({
          id: `commitment-${idx}`,
          type: 'commitment',
          title: commitment.title,
          description: commitment.description,
          confidence: commitment.confidence,
          status: 'pending',
          target_date: defaultTargetDate,
        })
      })

      setSuggestions(allSuggestions)
      setStep(allSuggestions.length > 0 ? 'review' : 'complete')
    } catch (error) {
      console.error('Failed to extract suggestions:', error)
      toast({
        title: 'Extraction Failed',
        description: 'Could not extract suggestions from the session.',
        variant: 'destructive',
      })
      setStep('complete')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = (id: string) => {
    setSuggestions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'accepted' } : s)),
    )
  }

  const handleReject = (id: string) => {
    setSuggestions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'rejected' } : s)),
    )
  }

  const handleAcceptAll = () => {
    setSuggestions(prev =>
      prev.map(s =>
        s.status === 'pending' ? { ...s, status: 'accepted' } : s,
      ),
    )
  }

  const handleRejectAll = () => {
    setSuggestions(prev =>
      prev.map(s =>
        s.status === 'pending' ? { ...s, status: 'rejected' } : s,
      ),
    )
  }

  const handleUpdateTargetDate = (id: string, date: Date | undefined) => {
    setSuggestions(prev =>
      prev.map(s => (s.id === id ? { ...s, target_date: date } : s)),
    )
  }

  const handleStartEdit = (item: SuggestionItem) => {
    setEditingItem(item.id)
    setEditTitle(item.title)
    setEditDescription(item.description || '')
    setEditTargetDate(item.target_date)
  }

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) return

    setSuggestions(prev =>
      prev.map(s =>
        s.id === id
          ? {
              ...s,
              title: editTitle.trim(),
              description: editDescription.trim(),
              target_date: editTargetDate,
              status: 'accepted',
            }
          : s,
      ),
    )
    setEditingItem(null)
    setEditTitle('')
    setEditDescription('')
    setEditTargetDate(undefined)
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setEditTitle('')
    setEditDescription('')
    setEditTargetDate(undefined)
  }

  const handleConfirmAll = async () => {
    const acceptedItems = suggestions.filter(s => s.status === 'accepted')
    if (acceptedItems.length === 0) {
      onOpenChange(false)
      onComplete?.()
      return
    }

    setIsSaving(true)
    try {
      // Save accepted wins
      const winPromises = acceptedItems
        .filter(s => s.type === 'win')
        .map(s =>
          WinsService.createWin({
            session_id: sessionId,
            client_id: clientId,
            title: s.title,
            description: s.description,
            is_ai_generated: true,
          }),
        )

      // Save accepted commitments
      const commitmentPromises = acceptedItems
        .filter(s => s.type === 'commitment')
        .map(s =>
          CommitmentService.createCommitment({
            title: s.title,
            description: s.description,
            client_id: clientId,
            session_id: sessionId,
            priority: 'medium',
            type: 'action',
            target_date: s.target_date
              ? format(s.target_date, 'yyyy-MM-dd')
              : undefined,
          }),
        )

      await Promise.all([...winPromises, ...commitmentPromises])

      toast({
        title: 'Saved Successfully',
        description: `Added ${acceptedItems.length} items from the session.`,
      })

      setStep('complete')
      onComplete?.()

      // Close modal after short delay
      setTimeout(() => {
        onOpenChange(false)
      }, 1500)
    } catch (error) {
      console.error('Failed to save items:', error)
      toast({
        title: 'Save Failed',
        description: 'Could not save some items. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = () => {
    onOpenChange(false)
    onComplete?.()
  }

  const acceptedCount = suggestions.filter(s => s.status === 'accepted').length
  const pendingCount = suggestions.filter(s => s.status === 'pending').length

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-100 text-gray-600'
    if (confidence >= 0.85) return 'bg-green-100 text-green-700'
    if (confidence >= 0.7) return 'bg-blue-100 text-blue-700'
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">Session Insights</DialogTitle>
              <DialogDescription className="text-sm">
                {step === 'loading' && 'Analyzing session for key takeaways...'}
                {step === 'review' && 'Review and confirm suggested items'}
                {step === 'complete' && 'All done!'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Loading State */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-purple-600 animate-spin mb-4" />
              <p className="text-sm text-gray-600">
                Extracting commitments and wins...
              </p>
            </div>
          )}

          {/* Review State */}
          {step === 'review' && (
            <div className="space-y-3">
              {/* Accept All / Reject All buttons */}
              {pendingCount > 1 && (
                <div className="flex items-center justify-end gap-2 pb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRejectAll}
                    className="text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAcceptAll}
                    className="text-gray-600 hover:text-green-600 hover:border-green-200 hover:bg-green-50"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Accept All
                  </Button>
                </div>
              )}

              {suggestions.map(item => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    item.status === 'accepted'
                      ? 'border-green-200 bg-green-50'
                      : item.status === 'rejected'
                        ? 'border-gray-200 bg-gray-50 opacity-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {editingItem === item.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <Input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        placeholder="Title"
                        className="border-gray-200"
                        autoFocus
                      />
                      <Textarea
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="border-gray-200 resize-none min-h-[60px]"
                      />
                      {/* Date picker for commitments */}
                      {item.type === 'commitment' && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            Due date:
                          </span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-left font-normal"
                              >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {editTargetDate
                                  ? format(editTargetDate, 'PPP')
                                  : 'Pick a date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={editTargetDate}
                                onSelect={setEditTargetDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(item.id)}
                          disabled={!editTitle.trim()}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div
                        className={`p-2 rounded-lg flex-shrink-0 ${
                          item.type === 'win'
                            ? 'bg-amber-100'
                            : 'bg-emerald-100'
                        }`}
                      >
                        {item.type === 'win' ? (
                          <Trophy className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Target className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500 uppercase">
                            {item.type === 'win' ? 'Win' : 'Commitment'}
                          </span>
                          {item.confidence && (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getConfidenceColor(item.confidence)}`}
                            >
                              {Math.round(item.confidence * 100)}%
                            </Badge>
                          )}
                          {item.status === 'accepted' && (
                            <Badge className="bg-green-600 text-white text-xs">
                              Accepted
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        {/* Date picker for commitments */}
                        {item.type === 'commitment' &&
                          item.status !== 'rejected' && (
                            <div className="flex items-center gap-2 mt-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs justify-start text-left font-normal border-gray-200 hover:border-gray-300"
                                  >
                                    <CalendarIcon className="h-3 w-3 mr-1.5" />
                                    {item.target_date
                                      ? format(item.target_date, 'MMM d, yyyy')
                                      : 'Set due date'}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={item.target_date}
                                    onSelect={date =>
                                      handleUpdateTargetDate(item.id, date)
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                      </div>

                      {/* Actions */}
                      {item.status === 'pending' && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => handleStartEdit(item)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleReject(item.id)}
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-500 hover:text-green-600 hover:bg-green-50"
                            onClick={() => handleAccept(item.id)}
                            title="Accept"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Summary and Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {acceptedCount > 0 ? (
                    <>
                      <span className="font-medium text-green-600">
                        {acceptedCount}
                      </span>{' '}
                      item{acceptedCount !== 1 ? 's' : ''} selected
                    </>
                  ) : pendingCount > 0 ? (
                    'Select items to save'
                  ) : (
                    'All items reviewed'
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    disabled={isSaving}
                  >
                    Skip
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirmAll}
                    disabled={isSaving || acceptedCount === 0}
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save {acceptedCount > 0 ? `(${acceptedCount})` : ''}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Complete State */}
          {step === 'complete' && suggestions.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                No suggestions found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                We couldn&apos;t find any commitments or wins to extract from
                this session.
              </p>
              <Button onClick={handleSkip} variant="outline">
                Close
              </Button>
            </div>
          )}

          {step === 'complete' && suggestions.length > 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Items Saved</h3>
              <p className="text-sm text-gray-500">
                Your session insights have been saved successfully.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
