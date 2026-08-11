import { ConfirmationDialog } from 'coach-sidekick'

export const DestructiveConfirm = () => (
  <ConfirmationDialog
    open
    onOpenChange={() => {}}
    onConfirm={() => {}}
    title="Delete this session?"
    description="The transcript and analysis will be permanently removed. This action cannot be undone."
    confirmText="Delete session"
    cancelText="Cancel"
    variant="destructive"
  />
)

export const DefaultConfirm = () => (
  <ConfirmationDialog
    open
    onOpenChange={() => {}}
    onConfirm={() => {}}
    title="Send recap to client?"
    description="Jordan Miles will receive the session summary and action items by email."
    confirmText="Send recap"
    cancelText="Not yet"
  />
)
