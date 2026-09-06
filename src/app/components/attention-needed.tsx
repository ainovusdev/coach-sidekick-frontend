'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  useCommitments,
  useMyCommitments,
} from '@/hooks/queries/use-commitments'
import { useViewerId } from '@/hooks/use-viewer-id'
import { isAssignedTo } from '@/lib/commitments/assignee'
import { SimpleClient } from '@/services/client-service'
import { Clock, UserX, ArrowRight, Inbox } from 'lucide-react'

interface AttentionNeededProps {
  clients: SimpleClient[]
}

const NEW_WINDOW_DAYS = 7

export function AttentionNeeded({ clients }: AttentionNeededProps) {
  const router = useRouter()
  const userId = useViewerId()
  const { data: myCommitmentsData } = useMyCommitments()
  // Same filter object as the hub's second query, so the cache is shared
  const { data: involvingData } = useCommitments({
    involving_me: true,
    include_drafts: true,
  })

  const overdueCount = useMemo(() => {
    const commitments = myCommitmentsData?.commitments ?? []
    const now = new Date()
    return commitments.filter(
      c =>
        c.status !== 'completed' &&
        c.status !== 'abandoned' &&
        c.target_date &&
        new Date(c.target_date) < now,
    ).length
  }, [myCommitmentsData])

  /** Handed to me by someone else in the last week, still open. */
  const newForMeCount = useMemo(() => {
    if (!userId) return 0
    const since = new Date()
    since.setDate(since.getDate() - NEW_WINDOW_DAYS)
    return (involvingData?.commitments ?? []).filter(
      c =>
        isAssignedTo(c, userId) &&
        c.assigned_by_id !== userId &&
        c.created_by_id !== userId &&
        c.status !== 'completed' &&
        c.status !== 'abandoned' &&
        c.status !== 'draft' &&
        new Date(c.created_at) >= since,
    ).length
  }, [involvingData, userId])

  const staleClientCount = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return clients.filter(c => {
      if (c.is_my_client === false) return false
      if (!c.last_session_date) return false
      return new Date(c.last_session_date) < thirtyDaysAgo
    }).length
  }, [clients])

  type AttentionItem = {
    label: string
    icon: typeof Clock
    href: string
    color: string
    iconColor: string
    testId: string
  }

  const items: AttentionItem[] = [
    overdueCount > 0
      ? {
          label: `${overdueCount} overdue`,
          icon: Clock,
          href: '/commitments?view=mine&due=overdue',
          color:
            'bg-vermillion-bg text-vermillion border-vermillion hover:bg-vermillion-bg ',
          iconColor: 'text-vermillion',
          testId: 'attention-overdue',
        }
      : null,
    newForMeCount > 0
      ? {
          label: `${newForMeCount} new for you`,
          icon: Inbox,
          href: '/commitments?view=mine',
          color:
            'bg-ds-accent-bg text-ds-accent border-ds-accent hover:bg-ds-accent-bg ',
          iconColor: 'text-ds-accent',
          testId: 'attention-new-for-you',
        }
      : null,
    staleClientCount > 0
      ? {
          label: `${staleClientCount} need${staleClientCount === 1 ? 's' : ''} follow-up`,
          icon: UserX,
          href: '/clients',
          color:
            'bg-amber-token-bg text-amber-token border-amber-token hover:bg-amber-token-bg ',
          iconColor: 'text-amber-token',
          testId: 'attention-follow-up',
        }
      : null,
  ].filter((item): item is AttentionItem => item !== null)

  if (items.length === 0) return null

  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      {items.map(item => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            data-testid={item.testId}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer group ${item.color}`}
          >
            <Icon className={`h-4 w-4 ${item.iconColor}`} />
            {item.label}
            <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity -mr-1" />
          </button>
        )
      })}
    </div>
  )
}
