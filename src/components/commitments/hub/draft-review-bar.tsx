'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

interface DraftReviewBarProps {
  visibleDraftIds: string[]
  selectedDraftIds: Set<string>
  onToggleAll: () => void
  onBulkApprove: () => void
  onBulkReject: () => void
  approving: boolean
  rejecting: boolean
}

/**
 * Bulk approve/reject bar for AI-extracted draft commitments.
 * Shown whenever drafts are visible in the current view (any tab).
 */
export function DraftReviewBar({
  visibleDraftIds,
  selectedDraftIds,
  onToggleAll,
  onBulkApprove,
  onBulkReject,
  approving,
  rejecting,
}: DraftReviewBarProps) {
  const allSelected =
    visibleDraftIds.length > 0 &&
    visibleDraftIds.every(id => selectedDraftIds.has(id))

  return (
    <Card className="border-amber-token bg-amber-token-bg/50 mb-4 py-0 gap-0">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
            <span className="text-sm text-ink-2 ">
              {selectedDraftIds.size > 0
                ? `${selectedDraftIds.size} of ${visibleDraftIds.length} selected`
                : `${visibleDraftIds.length} draft${
                    visibleDraftIds.length !== 1 ? 's' : ''
                  } pending review`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onBulkReject}
              disabled={selectedDraftIds.size === 0 || rejecting}
              className="border-vermillion text-vermillion hover:bg-vermillion-bg "
            >
              {rejecting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
              )}
              Reject
            </Button>
            <Button
              size="sm"
              onClick={onBulkApprove}
              disabled={selectedDraftIds.size === 0 || approving}
              className="bg-forest hover:bg-forest text-ink-on-dark"
            >
              {approving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Approve ({selectedDraftIds.size})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
