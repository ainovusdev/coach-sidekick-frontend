'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Commitment } from '@/types/commitment'
import { useCommitments } from '@/hooks/queries/use-commitments'
import {
  useBulkConfirmCommitments,
  useBulkDiscardCommitments,
} from '@/hooks/mutations/use-commitment-mutations'
import { Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface DraftCommitmentsReviewProps {
  sessionId: string
  drafts?: Commitment[]
  loading?: boolean
  onConfirmAll?: () => void
  onRefresh?: () => void
}

/**
 * Draft Commitments Review - Now using TanStack Query
 *
 * Benefits:
 * - Draft commitments cached
 * - Instant display if already loaded
 * - Automatic background refresh
 */
export function DraftCommitmentsReview({
  sessionId,
  drafts: propsDrafts,
  loading: propsLoading = false,
  onConfirmAll,
  onRefresh,
}: DraftCommitmentsReviewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  // Use TanStack Query for draft commitments (only if not provided via props)
  const { data: commitmentsData, isLoading: internalLoading } = useCommitments(
    {
      session_id: sessionId,
      status: 'draft',
      include_drafts: true,
    },
    {
      enabled: propsDrafts === undefined,
    },
  )

  // Use mutation hooks for bulk operations
  const bulkConfirm = useBulkConfirmCommitments()
  const bulkDiscard = useBulkDiscardCommitments()

  // Use props drafts if provided, otherwise use query data
  const drafts =
    propsDrafts !== undefined ? propsDrafts : commitmentsData?.commitments || []
  const loading = propsDrafts !== undefined ? propsLoading : internalLoading
  const confirming = bulkConfirm.isPending
  const discarding = bulkDiscard.isPending

  // Auto-select all drafts when they change
  useEffect(() => {
    if (drafts.length > 0) {
      setSelectedIds(new Set(drafts.map(c => c.id)))
    }
  }, [drafts])

  const handleSelectAll = () => {
    if (selectedIds.size === drafts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(drafts.map(d => d.id)))
    }
  }

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleConfirmSelected = async () => {
    if (selectedIds.size === 0) return

    try {
      await bulkConfirm.mutateAsync(Array.from(selectedIds))
      onConfirmAll?.()
      onRefresh?.()
    } catch (error) {
      console.error('Failed to confirm commitments:', error)
      toast({
        title: 'Error',
        description: 'Failed to confirm commitments',
        variant: 'destructive',
      })
    }
  }

  const handleDiscardSelected = async () => {
    if (selectedIds.size === 0) return

    try {
      await bulkDiscard.mutateAsync(Array.from(selectedIds))
      onRefresh?.()
    } catch (error) {
      console.error('Failed to discard commitments:', error)
      toast({
        title: 'Error',
        description: 'Failed to discard commitments',
        variant: 'destructive',
      })
    }
  }

  console.log('DraftCommitmentsReview render:', {
    drafts: drafts.length,
    loading,
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!drafts || drafts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Sparkles className="size-8 mx-auto mb-2 opacity-50" />
        <p>No draft commitments found</p>
        <p className="text-sm mt-1">
          Use the &quot;Extract Commitments&quot; button to find commitments
          from the session transcript
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size === drafts.length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} of {drafts.length} selected
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDiscardSelected}
            disabled={selectedIds.size === 0 || discarding}
          >
            {discarding ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="size-4 mr-2" />
            )}
            Discard
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmSelected}
            disabled={selectedIds.size === 0 || confirming}
          >
            {confirming ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4 mr-2" />
            )}
            Confirm Selected
          </Button>
        </div>
      </div>

      {/* Draft Commitment Cards */}
      <div className="space-y-3">
        {drafts.map(draft => (
          <Card
            key={draft.id}
            className={cn(
              'cursor-pointer transition-all hover:border-primary/50',
              selectedIds.has(draft.id) && 'border-primary bg-primary/5',
            )}
            onClick={() => handleToggleSelect(draft.id)}
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedIds.has(draft.id)}
                  onCheckedChange={() => handleToggleSelect(draft.id)}
                  onClick={e => e.stopPropagation()}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{draft.title}</CardTitle>
                      {draft.description && (
                        <CardDescription className="mt-1">
                          {draft.description}
                        </CardDescription>
                      )}
                    </div>
                    {draft.extraction_confidence && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'ml-2',
                          draft.extraction_confidence >= 0.8
                            ? 'bg-green-500/10 text-green-600'
                            : draft.extraction_confidence >= 0.6
                              ? 'bg-yellow-500/10 text-yellow-600'
                              : 'bg-gray-500/10 text-gray-600',
                        )}
                      >
                        {Math.round(draft.extraction_confidence * 100)}%
                        confidence
                      </Badge>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline">{draft.type}</Badge>
                    <Badge variant="outline">{draft.priority} priority</Badge>
                    {draft.target_date && (
                      <Badge variant="outline">Due: {draft.target_date}</Badge>
                    )}
                  </div>

                  {/* Transcript Context */}
                  {draft.transcript_context && (
                    <div className="mt-3 p-3 bg-accent/50 rounded-md border border-border/50">
                      <div className="flex items-start gap-2">
                        <Sparkles className="size-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            From transcript:
                          </p>
                          <p className="text-sm italic">
                            &quot;{draft.transcript_context}&quot;
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Measurement Criteria */}
                  {draft.measurement_criteria && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Success criteria:{' '}
                      </span>
                      <span>{draft.measurement_criteria}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
