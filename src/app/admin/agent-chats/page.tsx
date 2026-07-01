'use client'

import { useMemo, useState } from 'react'

import { formatDistanceToNow } from 'date-fns'
import { MessagesSquare, Search } from 'lucide-react'

import { AgentChatViewerDialog } from '@/components/admin/agent/agent-chat-viewer-dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminAgentChatGroups } from '@/hooks/queries/use-admin-agent-chats'
import type {
  AdminAgentChatGroup,
  AgentChatGroupBy,
} from '@/services/admin-service'

const TABS: { value: AgentChatGroupBy; label: string; plural: string }[] = [
  { value: 'coach', label: 'Coaches', plural: 'coaches' },
  { value: 'client', label: 'Clients', plural: 'clients' },
  { value: 'admin', label: 'Admins', plural: 'admins' },
]

export default function AdminAgentChatsPage() {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)

  const openThread = (threadId: string) => {
    setActiveThreadId(threadId)
    setViewerOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
          <MessagesSquare className="h-6 w-6" />
          Agent Chats
        </h1>
        <p className="mt-1 text-sm text-ink-3">
          Review every Sidekick agent conversation across coaches, clients, and
          admins. Read-only — this does not change what each user sees in their
          own agent.
        </p>
      </div>

      <Tabs defaultValue="coach">
        <TabsList>
          {TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <GroupList
              groupBy={tab.value}
              plural={tab.plural}
              onOpenThread={openThread}
            />
          </TabsContent>
        ))}
      </Tabs>

      <AgentChatViewerDialog
        threadId={activeThreadId}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  )
}

function GroupList({
  groupBy,
  plural,
  onOpenThread,
}: {
  groupBy: AgentChatGroupBy
  plural: string
  onOpenThread: (threadId: string) => void
}) {
  const { data, isLoading, error } = useAdminAgentChatGroups(groupBy)
  const [search, setSearch] = useState('')

  const groups = useMemo(() => {
    const all = data?.groups ?? []
    const query = search.trim().toLowerCase()
    if (!query) return all
    return all.filter(
      group =>
        group.name.toLowerCase().includes(query) ||
        (group.email ?? '').toLowerCase().includes(query) ||
        (group.coach_name ?? '').toLowerCase().includes(query),
    )
  }, [data, search])

  if (isLoading) return <GroupListSkeleton />

  if (error) {
    return (
      <p className="text-sm text-vermillion">Failed to load agent chats.</p>
    )
  }

  if ((data?.groups.length ?? 0) === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-ink-3">
          No {plural} have any agent chats yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
        <Input
          placeholder={`Search ${plural}…`}
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="pl-10"
        />
      </div>

      {groups.length === 0 ? (
        <p className="px-1 text-sm text-ink-3">No matches.</p>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {groups.map(group => (
            <GroupRow
              key={group.key}
              group={group}
              onOpenThread={onOpenThread}
            />
          ))}
        </Accordion>
      )}
    </div>
  )
}

function GroupRow({
  group,
  onOpenThread,
}: {
  group: AdminAgentChatGroup
  onOpenThread: (threadId: string) => void
}) {
  return (
    <AccordionItem
      value={group.key}
      className="rounded-lg border border-line bg-surface-1 px-4"
    >
      <AccordionTrigger className="hover:no-underline">
        <div className="flex w-full items-center justify-between gap-3 pr-2">
          <div className="min-w-0 text-left">
            <div className="truncate font-medium text-ink">{group.name}</div>
            <div className="truncate text-xs text-ink-3">
              {group.email}
              {group.coach_name ? `  ·  Coach: ${group.coach_name}` : ''}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {group.last_activity ? (
              <span className="hidden text-xs text-ink-3 sm:inline">
                {formatDistanceToNow(new Date(group.last_activity), {
                  addSuffix: true,
                })}
              </span>
            ) : null}
            <Badge variant="secondary">{group.thread_count}</Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <ul className="divide-y divide-line border-t border-line">
          {group.threads.map(thread => (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => onOpenThread(thread.id)}
                className="-mx-2 flex w-full items-center justify-between gap-3 rounded px-2 py-2.5 text-left transition-colors hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm text-ink">
                    {thread.title}
                  </div>
                  <div className="text-xs text-ink-3">
                    {thread.message_count} message
                    {thread.message_count === 1 ? '' : 's'} · {thread.model}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-ink-3">
                  {formatDistanceToNow(new Date(thread.last_message_at), {
                    addSuffix: true,
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  )
}

function GroupListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full max-w-md" />
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  )
}
