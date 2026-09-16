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
import { CommentThread } from '@/components/comments/comment-thread'
import { Section } from '@/components/sandboxes/section'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { useUpdateSandbox } from '@/hooks/mutations/use-sandbox-mutations'
import type { SandboxOverview } from '@/types/sandbox'

/**
 * What the client wants to be true by the end of the term.
 *
 * It owns its own editor state: the panel is reached from Settings and from the
 * setup checklist, and nothing above it needs to know whether the dialog is
 * open. There is no read gate — every member of a sandbox may read the vision
 * and comment on it; only the editing is gated.
 */
export function VisionPanel({ overview }: { overview: SandboxOverview }) {
  const { sandbox, members } = overview
  const canEdit = useSandboxView().can.editSandbox
  const [open, onOpenChange] = useState(false)
  const vision = (sandbox.vision || '').trim()
  const primaryClient = members.find(m => m.roles.includes('primary_client'))

  // `?comment=<id>#vision` — the bell's link to a comment under the vision.
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(
    null,
  )
  useEffect(() => {
    if (window.location.hash !== '#vision') return
    setHighlightCommentId(
      new URLSearchParams(window.location.search).get('comment'),
    )
    document.getElementById('vision')?.scrollIntoView({ block: 'start' })
  }, [])

  return (
    <Section
      id="vision"
      title="Vision"
      testId="vision-panel"
      aside={
        vision &&
        canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-ink-2"
            onClick={() => onOpenChange(true)}
          >
            Edit
          </Button>
        )
      }
      footer={
        <div data-testid="vision-comments">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            Comments
          </h3>
          <CommentThread
            targetType="sandbox_vision"
            targetId={sandbox.id}
            context={{ sandboxId: sandbox.id }}
            highlightId={highlightCommentId}
          />
        </div>
      }
    >
      {vision ? (
        <figure>
          <blockquote className="max-w-prose border-l-2 border-line pl-4 text-[15px] leading-relaxed text-ink-2">
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
            What does the client want to be true by the end of the term? One or
            two sentences, in their words.
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
      {canEdit && (
        <VisionDialog
          open={open}
          onOpenChange={onOpenChange}
          overview={overview}
        />
      )}
    </Section>
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
