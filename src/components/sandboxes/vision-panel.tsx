'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { useUpdateSandbox } from '@/hooks/mutations/use-sandbox-mutations'
import type { SandboxOverview } from '@/types/sandbox'

export function VisionPanel({
  overview,
  open,
  onOpenChange,
}: {
  overview: SandboxOverview
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { sandbox, members } = overview
  const canEdit = useSandboxView().can.editSandbox
  const vision = (sandbox.vision || '').trim()
  const primaryClient = members.find(m => m.roles.includes('primary_client'))

  return (
    <section
      id="vision"
      className="scroll-mt-20 rounded-xl border border-line bg-paper"
      data-testid="vision-panel"
    >
      <header className="flex items-baseline justify-between border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink">Vision</h2>
        {vision && canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-ink-2"
            onClick={() => onOpenChange(true)}
          >
            Edit
          </Button>
        )}
      </header>
      <div className="px-5 py-5">
        {vision ? (
          <figure>
            <blockquote className="text-lg leading-relaxed text-ink">
              “{vision}”
            </blockquote>
            {primaryClient && (
              <figcaption className="mt-3 text-sm text-ink-3">
                {primaryClient.name || primaryClient.email}, primary client
              </figcaption>
            )}
          </figure>
        ) : !canEdit ? (
          <p className="text-sm text-ink-3" data-testid="vision-empty">
            The vision hasn’t been written yet.
          </p>
        ) : (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-sm text-ink-3">
              What does the client want to be true by the end of the term? One
              or two sentences, in their words.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(true)}
              data-testid="write-vision"
            >
              Write the vision
            </Button>
          </div>
        )}
      </div>
      {canEdit && (
        <VisionDialog
          open={open}
          onOpenChange={onOpenChange}
          overview={overview}
        />
      )}
    </section>
  )
}

function VisionDialog({
  open,
  onOpenChange,
  overview,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  overview: SandboxOverview
}) {
  const update = useUpdateSandbox(overview.sandbox.id)
  const [text, setText] = useState(overview.sandbox.vision || '')

  useEffect(() => {
    if (open) setText(overview.sandbox.vision || '')
  }, [open, overview.sandbox.vision])

  const save = async () => {
    await update.mutateAsync({ vision: text.trim() || null })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vision</DialogTitle>
          <DialogDescription>
            In the client’s words. This is what everyone on the sandbox will
            read first.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={6}
          placeholder="By the end of the term…"
          autoFocus
          data-testid="vision-textarea"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-ink text-ink-on-dark hover:bg-ink/90"
            disabled={update.isPending}
            onClick={save}
            data-testid="save-vision"
          >
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
