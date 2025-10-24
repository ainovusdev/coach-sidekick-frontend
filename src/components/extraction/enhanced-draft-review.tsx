'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  Trophy,
  Loader2,
  Link2,
} from 'lucide-react'
import { toast } from 'sonner'
import { CommitmentTargetSelector } from './commitment-target-selector'

interface DraftGoal {
  id: string
  title: string
  description?: string
  category: string
  status: string
  confidence: number
  transcript_context: string
}

interface DraftTarget {
  id: string
  goal_id: string
  title: string
  description?: string
  status: string
  confidence: number
  transcript_context: string
}

interface DraftCommitment {
  id?: string
  title: string
  description?: string
  type: string
  status?: string
  confidence: number
  link_to_target_ids?: string[]
  suggested_target_indices?: number[]
  transcript_context?: string
}

interface EnhancedDraftReviewProps {
  draftGoals: DraftGoal[]
  draftTargets: DraftTarget[]
  draftCommitments: DraftCommitment[]
  currentSprintId?: string | null
  onConfirmGoals: (goalIds: string[]) => Promise<void>
  onConfirmTargets: (targetIds: string[]) => Promise<void>
  onConfirmCommitments: (commitmentIds: string[]) => Promise<void>
  onConfirmAll: () => Promise<void>
  onRefresh?: () => void
}

export function EnhancedDraftReview({
  draftGoals,
  draftTargets,
  draftCommitments,
  currentSprintId,
  onConfirmGoals,
  onConfirmTargets,
  onConfirmCommitments,
  onConfirmAll,
  onRefresh,
}: EnhancedDraftReviewProps) {
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(
    new Set(draftGoals.map(g => g.id)),
  )
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(
    new Set(draftTargets.map(t => t.id)),
  )
  const [selectedCommitments, setSelectedCommitments] = useState<Set<string>>(
    new Set(draftCommitments.map(c => c.id)),
  )
  const [confirming, setConfirming] = useState(false)

  const totalExtracted =
    draftGoals.length + draftTargets.length + draftCommitments.length

  if (totalExtracted === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No drafts to review</p>
        </CardContent>
      </Card>
    )
  }

  const handleToggleGoal = (id: string) => {
    const newSet = new Set(selectedGoals)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedGoals(newSet)
  }

  const handleToggleTarget = (id: string) => {
    const newSet = new Set(selectedTargets)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedTargets(newSet)
  }

  const handleToggleCommitment = (id: string) => {
    const newSet = new Set(selectedCommitments)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedCommitments(newSet)
  }

  const handleConfirmAll = async () => {
    setConfirming(true)
    try {
      await onConfirmAll()
      toast.success('All Confirmed', {
        description: `Successfully confirmed ${totalExtracted} extracted items`,
      })
      onRefresh?.()
    } catch (error) {
      console.error('Failed to confirm all:', error)
    } finally {
      setConfirming(false)
    }
  }

  const handleConfirmSelected = async () => {
    setConfirming(true)
    try {
      // Confirm in order: goals → targets → commitments (respects dependencies)
      if (selectedGoals.size > 0) {
        await onConfirmGoals(Array.from(selectedGoals))
      }
      if (selectedTargets.size > 0) {
        await onConfirmTargets(Array.from(selectedTargets))
      }
      if (selectedCommitments.size > 0) {
        await onConfirmCommitments(Array.from(selectedCommitments))
      }

      const totalConfirmed =
        selectedGoals.size + selectedTargets.size + selectedCommitments.size
      toast.success('Confirmed Selected', {
        description: `Successfully confirmed ${totalConfirmed} items`,
      })
      onRefresh?.()
    } catch (error) {
      console.error('Failed to confirm selected:', error)
    } finally {
      setConfirming(false)
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.85) return 'bg-green-100 text-green-800'
    if (confidence >= 0.75) return 'bg-blue-100 text-blue-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Extraction Results
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-50">
              {totalExtracted} items found
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-gray-50">
            <TabsTrigger value="all">All ({totalExtracted})</TabsTrigger>
            <TabsTrigger value="goals">
              Outcomes ({draftGoals.length})
            </TabsTrigger>
            <TabsTrigger value="targets">
              Desired Wins ({draftTargets.length})
            </TabsTrigger>
            <TabsTrigger value="commitments">
              Commitments ({draftCommitments.length})
            </TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-6">
            {/* Summary */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 mb-1">
                    Extraction Complete
                  </h4>
                  <p className="text-sm text-purple-800">
                    Found {draftGoals.length} outcomes, {draftTargets.length}{' '}
                    desired wins, and {draftCommitments.length} commitments from
                    the session transcript. Review and confirm the items below.
                  </p>
                </div>
              </div>
            </div>

            {/* Goals Section */}
            {draftGoals.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">
                    New Outcomes ({draftGoals.length})
                  </h3>
                </div>
                {draftGoals.map(goal => (
                  <Card key={goal.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedGoals.has(goal.id)}
                          onCheckedChange={() => handleToggleGoal(goal.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {goal.title}
                              </h4>
                              {goal.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {goal.description}
                                </p>
                              )}
                            </div>
                            <Badge
                              className={getConfidenceBadge(goal.confidence)}
                            >
                              {Math.round(goal.confidence * 100)}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{goal.category}</Badge>
                          </div>
                          {goal.transcript_context && (
                            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-sm italic text-gray-700">
                              &quot;{goal.transcript_context}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {draftGoals.length > 0 && draftTargets.length > 0 && <Separator />}

            {/* Targets Section */}
            {draftTargets.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    New Desired Wins ({draftTargets.length})
                  </h3>
                </div>
                {draftTargets.map(target => (
                  <Card key={target.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedTargets.has(target.id)}
                          onCheckedChange={() => handleToggleTarget(target.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {target.title}
                              </h4>
                              {target.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {target.description}
                                </p>
                              )}
                            </div>
                            <Badge
                              className={getConfidenceBadge(target.confidence)}
                            >
                              {Math.round(target.confidence * 100)}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Link2 className="h-3 w-3" />
                            <span>Links to outcome</span>
                          </div>
                          {target.transcript_context && (
                            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-sm italic text-gray-700">
                              &quot;{target.transcript_context}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {(draftGoals.length > 0 || draftTargets.length > 0) &&
              draftCommitments.length > 0 && <Separator />}

            {/* Commitments Section */}
            {draftCommitments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold text-gray-900">
                    New Commitments ({draftCommitments.length})
                  </h3>
                </div>
                {draftCommitments.map(commitment => (
                  <Card key={commitment.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedCommitments.has(commitment.id)}
                          onCheckedChange={() =>
                            handleToggleCommitment(commitment.id)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {commitment.title}
                              </h4>
                              {commitment.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {commitment.description}
                                </p>
                              )}
                            </div>
                            <Badge
                              className={getConfidenceBadge(
                                commitment.confidence,
                              )}
                            >
                              {Math.round(commitment.confidence * 100)}%
                            </Badge>
                          </div>

                          {/* Target Selector for Commitment */}
                          <div className="space-y-2 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{commitment.type}</Badge>
                            </div>
                            <CommitmentTargetSelector
                              linkedTargetIds={
                                commitment.link_to_target_ids || []
                              }
                              suggestedTargetIndices={
                                commitment.suggested_target_indices || []
                              }
                              extractedTargets={draftTargets}
                              currentSprintId={currentSprintId || null}
                              onChange={(targetIds, indices) => {
                                // Update the commitment directly (mutations are ok for draft data)
                                commitment.link_to_target_ids = targetIds
                                commitment.suggested_target_indices = indices
                              }}
                            />
                          </div>

                          {commitment.transcript_context && (
                            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-sm italic text-gray-700">
                              &quot;{commitment.transcript_context}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {selectedGoals.size +
                  selectedTargets.size +
                  selectedCommitments.size}{' '}
                of {totalExtracted} selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedGoals(new Set())
                    setSelectedTargets(new Set())
                    setSelectedCommitments(new Set())
                  }}
                  disabled={confirming}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Deselect All
                </Button>
                <Button
                  variant="outline"
                  onClick={handleConfirmSelected}
                  disabled={
                    confirming ||
                    (selectedGoals.size === 0 &&
                      selectedTargets.size === 0 &&
                      selectedCommitments.size === 0)
                  }
                >
                  {confirming ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Confirm Selected
                </Button>
                <Button onClick={handleConfirmAll} disabled={confirming}>
                  {confirming ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Confirm All
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-3">
            {draftGoals.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No outcomes extracted
              </p>
            ) : (
              <>
                {draftGoals.map(goal => (
                  <Card key={goal.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedGoals.has(goal.id)}
                          onCheckedChange={() => handleToggleGoal(goal.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {goal.title}
                              </h4>
                              {goal.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {goal.description}
                                </p>
                              )}
                            </div>
                            <Badge
                              className={getConfidenceBadge(goal.confidence)}
                            >
                              {Math.round(goal.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <Badge variant="outline">{goal.category}</Badge>
                          {goal.transcript_context && (
                            <div className="bg-purple-50 border border-purple-200 rounded p-3">
                              <p className="text-xs font-medium text-purple-900 mb-1">
                                From transcript:
                              </p>
                              <p className="text-sm italic text-purple-800">
                                &quot;{goal.transcript_context}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setConfirming(true)
                      try {
                        await onConfirmGoals(Array.from(selectedGoals))
                        toast.success('Outcomes Confirmed')
                        onRefresh?.()
                      } finally {
                        setConfirming(false)
                      }
                    }}
                    disabled={selectedGoals.size === 0 || confirming}
                  >
                    Confirm {selectedGoals.size} Outcome
                    {selectedGoals.size !== 1 ? 's' : ''}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Targets Tab */}
          <TabsContent value="targets" className="space-y-3">
            {draftTargets.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No desired wins extracted
              </p>
            ) : (
              <>
                {draftTargets.map(target => (
                  <Card key={target.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedTargets.has(target.id)}
                          onCheckedChange={() => handleToggleTarget(target.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {target.title}
                              </h4>
                              {target.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {target.description}
                                </p>
                              )}
                            </div>
                            <Badge
                              className={getConfidenceBadge(target.confidence)}
                            >
                              {Math.round(target.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Link2 className="h-3 w-3" />
                            <span>Linked to goal</span>
                          </div>
                          {target.transcript_context && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <p className="text-xs font-medium text-blue-900 mb-1">
                                From transcript:
                              </p>
                              <p className="text-sm italic text-blue-800">
                                &quot;{target.transcript_context}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setConfirming(true)
                      try {
                        await onConfirmTargets(Array.from(selectedTargets))
                        toast.success('Desired Wins Confirmed')
                        onRefresh?.()
                      } finally {
                        setConfirming(false)
                      }
                    }}
                    disabled={selectedTargets.size === 0 || confirming}
                  >
                    Confirm {selectedTargets.size} Desired Win
                    {selectedTargets.size !== 1 ? 's' : ''}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Commitments Tab */}
          <TabsContent value="commitments" className="space-y-3">
            {draftCommitments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No commitments extracted
              </p>
            ) : (
              <>
                {draftCommitments.map(commitment => (
                  <Card key={commitment.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedCommitments.has(commitment.id)}
                          onCheckedChange={() =>
                            handleToggleCommitment(commitment.id)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {commitment.title}
                              </h4>
                              {commitment.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {commitment.description}
                                </p>
                              )}
                            </div>
                            <Badge
                              className={getConfidenceBadge(
                                commitment.confidence,
                              )}
                            >
                              {Math.round(commitment.confidence * 100)}%
                              confidence
                            </Badge>
                          </div>

                          {/* Target Selector */}
                          <div className="space-y-2 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{commitment.type}</Badge>
                            </div>
                            <CommitmentTargetSelector
                              linkedTargetIds={
                                commitment.link_to_target_ids || []
                              }
                              suggestedTargetIndices={
                                commitment.suggested_target_indices || []
                              }
                              extractedTargets={draftTargets}
                              currentSprintId={currentSprintId || null}
                              onChange={(targetIds, indices) => {
                                // Update the commitment directly (mutations are ok for draft data)
                                commitment.link_to_target_ids = targetIds
                                commitment.suggested_target_indices = indices
                              }}
                            />
                          </div>
                          {commitment.transcript_context && (
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <p className="text-xs font-medium text-green-900 mb-1">
                                From transcript:
                              </p>
                              <p className="text-sm italic text-green-800">
                                &quot;{commitment.transcript_context}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setConfirming(true)
                      try {
                        await onConfirmCommitments(
                          Array.from(selectedCommitments),
                        )
                        toast.success('Commitments Confirmed')
                        onRefresh?.()
                      } finally {
                        setConfirming(false)
                      }
                    }}
                    disabled={selectedCommitments.size === 0 || confirming}
                  >
                    Confirm {selectedCommitments.size} Commitment
                    {selectedCommitments.size !== 1 ? 's' : ''}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Global Actions */}
        <div className="mt-6 pt-4 border-t flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleConfirmSelected}
            disabled={
              confirming ||
              (selectedGoals.size === 0 &&
                selectedTargets.size === 0 &&
                selectedCommitments.size === 0)
            }
          >
            {confirming ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Confirm Selected (
            {selectedGoals.size +
              selectedTargets.size +
              selectedCommitments.size}
            )
          </Button>
          <Button
            onClick={handleConfirmAll}
            disabled={confirming}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {confirming ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Confirm All ({totalExtracted})
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
