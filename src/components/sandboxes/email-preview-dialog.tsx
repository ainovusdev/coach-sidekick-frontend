'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAddedEmailPreview,
  useInvitationPreview,
} from '@/hooks/queries/use-sandboxes'

/**
 * Shows an email exactly as it will be sent. `kind` picks which one: the
 * client-side invitation, or the "you were added" notice our own people get.
 */
export function EmailPreviewDialog({
  sandboxId,
  memberId,
  kind = 'invitation',
  onOpenChange,
}: {
  sandboxId: string
  memberId: string | null
  kind?: 'invitation' | 'added'
  onOpenChange: (open: boolean) => void
}) {
  const invitation = useInvitationPreview(
    sandboxId,
    kind === 'invitation' ? memberId : null,
  )
  const added = useAddedEmailPreview(
    sandboxId,
    kind === 'added' ? memberId : null,
  )
  const preview = kind === 'added' ? added : invitation

  return (
    <Dialog open={!!memberId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" data-testid="email-preview">
        <DialogHeader>
          <DialogTitle>
            {preview.data?.subject ??
              (kind === 'added' ? 'Added to the sandbox' : 'Invitation email')}
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
