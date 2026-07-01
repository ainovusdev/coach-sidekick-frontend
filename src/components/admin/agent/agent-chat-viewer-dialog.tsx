'use client'

/**
 * Read-only viewer for a single agent chat, used by the super-admin Agent Chats
 * oversight page. Reuses the exact same <AgentMessage> renderer the live chat
 * uses (apiScope="admin" → full tool-call cards + charts), so nothing about how a
 * conversation looks has to be re-implemented here.
 */

import { format } from 'date-fns'

import { AgentMessage } from '@/components/admin/agent/agent-message'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminAgentChatThread } from '@/hooks/queries/use-admin-agent-chats'
import type { AdminAgentChatThreadDetail } from '@/services/admin-service'

const SCOPE_LABEL: Record<string, string> = {
  coach: 'Coach',
  client: 'Client',
  admin: 'Admin',
}

interface Props {
  threadId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgentChatViewerDialog({ threadId, open, onOpenChange }: Props) {
  // Only fetch while the dialog is open with a selected thread.
  const {
    data: thread,
    isLoading,
    error,
  } = useAdminAgentChatThread(open ? threadId : null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-line px-6 pb-4 pt-6 text-left">
          <div className="flex items-center gap-2">
            <DialogTitle className="truncate">
              {thread?.title ?? 'Conversation'}
            </DialogTitle>
            {thread ? (
              <Badge variant="secondary">
                {SCOPE_LABEL[thread.scope] ?? thread.scope}
              </Badge>
            ) : null}
          </div>
          <DialogDescription className="text-xs">
            {thread ? subtitle(thread) : 'Loading conversation…'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <ViewerSkeleton />
          ) : error ? (
            <p className="text-sm text-vermillion">
              Failed to load conversation.
            </p>
          ) : thread && thread.messages.length > 0 ? (
            thread.messages.map(message => (
              <AgentMessage
                key={message.id}
                message={message}
                apiScope="admin"
              />
            ))
          ) : (
            <p className="text-sm text-ink-3">
              No messages in this conversation.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function subtitle(thread: AdminAgentChatThreadDetail): string {
  const parts: string[] = []
  if (thread.owner_name) parts.push(thread.owner_name)
  if (thread.scope === 'client' && thread.coach_name) {
    parts.push(`Coach: ${thread.coach_name}`)
  }
  parts.push(thread.model)
  parts.push(format(new Date(thread.created_at), 'MMM d, yyyy'))
  return parts.join('  ·  ')
}

function ViewerSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-3/4" />
      <Skeleton className="ml-auto h-10 w-1/2" />
      <Skeleton className="h-24 w-4/5" />
    </div>
  )
}
