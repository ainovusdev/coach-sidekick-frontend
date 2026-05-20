'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Target, Sparkles, Trophy, Loader2, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { commitmentTypeLabels } from '@/types/commitment'

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
  onConfirmAll: () => Promise<void>
  onRefresh?: () => void
}

export function EnhancedDraftReview({
  draftGoals,
  draftTargets,
  draftCommitments,
  onConfirmAll,
  onRefresh,
}: EnhancedDraftReviewProps) {
  const [confirming, setConfirming] = useState(false)

  const totalExtracted =
    draftGoals.length + draftTargets.length + draftCommitments.length

  if (totalExtracted === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 text-ink-2 mx-auto mb-4" />
          <p className="text-ink-3">No drafts to review</p>
        </CardContent>
      </Card>
    )
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
      console.error('EnhancedDraftReview: Failed to confirm all:', error)
    } finally {
      setConfirming(false)
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.85) return 'bg-forest-bg text-forest'
    if (confidence >= 0.75) return 'bg-ds-accent-bg text-ds-accent'
    if (confidence >= 0.6) return 'bg-amber-token-bg text-amber-token'
    return 'bg-surface-3 text-ink-2'
  }

  return (
    <Card className="border-line">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ink-3" />
            AI Extraction Results
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-paper">
              {totalExtracted} items found
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-paper">
            <TabsTrigger value="all">All ({totalExtracted})</TabsTrigger>
            <TabsTrigger value="goals">
              Meta Performance Outcomes ({draftGoals.length})
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
            {/* Summary & Action */}
            <div className="bg-paper border border-line rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Sparkles className="h-5 w-5 text-ink-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-ink mb-1">
                      Extraction Complete
                    </h4>
                    <p className="text-sm text-ink-2">
                      Found {draftGoals.length} meta performance outcomes,{' '}
                      {draftTargets.length} desired wins,{' '}
                      {draftCommitments.length} commitments. Review and confirm
                      to save.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleConfirmAll}
                  disabled={confirming}
                  size="lg"
                  className="bg-ink hover:bg-ink-2 text-ink-on-dark flex-shrink-0"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Confirm & Save ({totalExtracted})
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Goals Section */}
            {draftGoals.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-ink-3" />
                  <h3 className="font-semibold text-ink">
                    New Meta Performance Outcomes ({draftGoals.length})
                  </h3>
                </div>
                {draftGoals.map(goal => (
                  <Card key={goal.id} className="border-line">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-ink">
                                {goal.title}
                              </h4>
                              {goal.description && (
                                <p className="text-sm text-ink-3 mt-1">
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
                            <div className="bg-paper border border-line rounded p-2 text-sm italic text-ink-2">
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
                  <Target className="h-4 w-4 text-ds-accent" />
                  <h3 className="font-semibold text-ink">
                    New Desired Wins ({draftTargets.length})
                  </h3>
                </div>
                {draftTargets.map(target => (
                  <Card key={target.id} className="border-line">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-ink">
                                {target.title}
                              </h4>
                              {target.description && (
                                <p className="text-sm text-ink-3 mt-1">
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
                          <div className="flex items-center gap-2 text-sm text-ink-3">
                            <Link2 className="h-3 w-3" />
                            <span>Links to outcome</span>
                          </div>
                          {target.transcript_context && (
                            <div className="bg-paper border border-line rounded p-2 text-sm italic text-ink-2">
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
                  <Target className="h-4 w-4 text-forest" />
                  <h3 className="font-semibold text-ink">
                    New Commitments ({draftCommitments.length})
                  </h3>
                </div>
                {draftCommitments.map(commitment => (
                  <Card key={commitment.id} className="border-line">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-ink">
                                {commitment.title}
                              </h4>
                              {commitment.description && (
                                <p className="text-sm text-ink-3 mt-1">
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
                              <Badge variant="outline">
                                {commitmentTypeLabels[commitment.type] ||
                                  commitment.type}
                              </Badge>
                            </div>
                          </div>

                          {commitment.transcript_context && (
                            <div className="bg-paper border border-line rounded p-2 text-sm italic text-ink-2">
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
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-3">
            {draftGoals.length === 0 ? (
              <p className="text-center text-ink-3 py-8">
                No meta performance outcomes extracted
              </p>
            ) : (
              <>
                {draftGoals.map(goal => (
                  <Card key={goal.id} className="border-line">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-ink">
                                {goal.title}
                              </h4>
                              {goal.description && (
                                <p className="text-sm text-ink-3 mt-1">
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
                            <div className="bg-paper border border-line rounded p-3">
                              <p className="text-xs font-medium text-ink mb-1">
                                From transcript:
                              </p>
                              <p className="text-sm italic text-ink-2">
                                &quot;{goal.transcript_context}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          {/* Targets Tab */}
          <TabsContent value="targets" className="space-y-3">
            {draftTargets.length === 0 ? (
              <p className="text-center text-ink-3 py-8">
                No desired wins extracted
              </p>
            ) : (
              <>
                {draftTargets.map(target => (
                  <Card key={target.id} className="border-line">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-ink">
                                {target.title}
                              </h4>
                              {target.description && (
                                <p className="text-sm text-ink-3 mt-1">
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
                          <div className="flex items-center gap-2 text-sm text-ds-accent">
                            <Link2 className="h-3 w-3" />
                            <span>Linked to goal</span>
                          </div>
                          {target.transcript_context && (
                            <div className="bg-ds-accent-bg border border-ds-accent rounded p-3">
                              <p className="text-xs font-medium text-ds-accent mb-1">
                                From transcript:
                              </p>
                              <p className="text-sm italic text-ds-accent">
                                &quot;{target.transcript_context}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          {/* Commitments Tab */}
          <TabsContent value="commitments" className="space-y-3">
            {draftCommitments.length === 0 ? (
              <p className="text-center text-ink-3 py-8">
                No commitments extracted
              </p>
            ) : (
              <>
                {draftCommitments.map(commitment => (
                  <Card key={commitment.id} className="border-line">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-ink">
                                {commitment.title}
                              </h4>
                              {commitment.description && (
                                <p className="text-sm text-ink-3 mt-1">
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
                              <Badge variant="outline">
                                {commitmentTypeLabels[commitment.type] ||
                                  commitment.type}
                              </Badge>
                            </div>
                          </div>
                          {commitment.transcript_context && (
                            <div className="bg-forest-bg border border-forest rounded p-3">
                              <p className="text-xs font-medium text-forest mb-1">
                                From transcript:
                              </p>
                              <p className="text-sm italic text-forest">
                                &quot;{commitment.transcript_context}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Global Action at Bottom */}
        <div className="mt-6 pt-4 border-t flex justify-center">
          <Button
            onClick={handleConfirmAll}
            disabled={confirming}
            size="lg"
            className="bg-ink hover:bg-ink-2 text-ink-on-dark px-8"
          >
            {confirming ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Confirm & Save All ({totalExtracted} items)
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
