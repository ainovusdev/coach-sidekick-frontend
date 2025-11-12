'use client'

import { Button } from '@/components/ui/button'
import { Plus, StickyNote, Sparkles, Loader2 } from 'lucide-react'

interface QuickActionsBarProps {
  onCreateCommitment: () => void
  onAddNote: () => void
  onRegenerate: () => void
  isRegenerating?: boolean
  canRegenerate?: boolean
  isViewer?: boolean
}

export function QuickActionsBar({
  onCreateCommitment,
  onAddNote,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  isViewer = false,
}: QuickActionsBarProps) {
  if (isViewer) return null

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-black mb-1">
            Quick Actions
          </h3>
          <p className="text-xs text-gray-500">
            Take action on this session without navigating through tabs
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onCreateCommitment}
            variant="outline"
            size="sm"
            className="border-gray-300 hover:bg-gray-50 hover:border-black transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Commitment
          </Button>

          <Button
            onClick={onAddNote}
            variant="outline"
            size="sm"
            className="border-gray-300 hover:bg-gray-50 hover:border-black transition-colors"
          >
            <StickyNote className="h-4 w-4 mr-2" />
            Add Note
          </Button>

          <Button
            onClick={onRegenerate}
            disabled={isRegenerating || !canRegenerate}
            className="bg-black hover:bg-gray-800 text-white"
            size="sm"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate Analysis
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
