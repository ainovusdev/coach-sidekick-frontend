'use client'

import { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ResourceDetailDialog,
  ResourceRow,
} from '@/components/client-portal/recent-resources-widget'
import { OwnUploadActions } from '@/components/client-portal/own-upload-actions'
import { UploadResourceDialog } from '@/components/client-portal/upload-resource-dialog'
import { useClientResources } from '@/hooks/queries/use-client-resources'

/** The session's resources: what the coach attached, plus the coachee's own
 * uploads for this session, with "Add a file" so prep can happen beforehand. */
export function SessionResourcesCard({ sessionId }: { sessionId: string }) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewing, setViewing] = useState<string | null>(null)
  const { data, isLoading } = useClientResources({
    session_id: sessionId,
    limit: 100,
  })
  const rows = data?.resources ?? []

  return (
    <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-ink-3" />
          <h2 className="font-semibold text-ink">Resources</h2>
          {rows.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-surface-3 text-ink-3 text-xs"
            >
              {rows.length}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add a file
        </Button>
      </div>
      <div className="px-5 py-2">
        {isLoading ? (
          <div className="space-y-2 py-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-3">
            Nothing here yet. Add a file or link for this session.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {rows.map(r => (
              <ResourceRow
                key={r.id}
                resource={r}
                onViewDetail={setViewing}
                actions={r.is_mine ? <OwnUploadActions resource={r} /> : null}
              />
            ))}
          </div>
        )}
      </div>

      <UploadResourceDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        sessionId={sessionId}
      />
      <ResourceDetailDialog
        resourceId={viewing}
        open={!!viewing}
        onOpenChange={open => !open && setViewing(null)}
      />
    </div>
  )
}
