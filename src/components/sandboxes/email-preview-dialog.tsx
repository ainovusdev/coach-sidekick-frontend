'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvitationPreview } from '@/hooks/queries/use-sandboxes'

export function EmailPreviewDialog({
  sandboxId,
  memberId,
  onOpenChange,
}: {
  sandboxId: string
  memberId: string | null
  onOpenChange: (open: boolean) => void
}) {
  const preview = useInvitationPreview(sandboxId, memberId)

  return (
    <Dialog open={!!memberId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" data-testid="email-preview">
        <DialogHeader>
          <DialogTitle>
            {preview.data?.subject ?? 'Invitation email'}
          </DialogTitle>
          <DialogDescription>
            {preview.data
              ? `To ${preview.data.to_email}. This is exactly what they will receive.`
              : 'Loading the email…'}
          </DialogDescription>
        </DialogHeader>
        {preview.isLoading || !preview.data ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <iframe
            title="Email preview"
            srcDoc={preview.data.html}
            sandbox=""
            className="h-[520px] w-full rounded-lg border border-line bg-white"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
