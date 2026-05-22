'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  useMyCommitments,
  useCommitments,
} from '@/hooks/queries/use-commitments'
import { SimpleClient } from '@/services/client-service'
import { Clock, FileEdit, UserX, ArrowRight } from 'lucide-react'

interface AttentionNeededProps {
  clients: SimpleClient[]
}

export function AttentionNeeded({ clients }: AttentionNeededProps) {
  const router = useRouter()
  const { data: myCommitmentsData } = useMyCommitments()
  const { data: draftCommitmentsData } = useCommitments({
    status: 'draft',
    my_clients_only: true,
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

  const staleClientCount = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return clients.filter(c => {
      if (c.is_my_client === false) return false
      if (!c.last_session_date) return false
      return new Date(c.last_session_date) < thirtyDaysAgo
    }).length
  }, [clients])

  const draftCount = draftCommitmentsData?.commitments?.length ?? 0

  type AttentionItem = {
    label: string
    icon: typeof Clock
    href: string
    color: string
    iconColor: string
  }

  const items: AttentionItem[] = [
    overdueCount > 0
      ? {
          label: `${overdueCount} overdue`,
          icon: Clock,
          href: '/commitments',
          color:
            'bg-vermillion-bg text-vermillion border-vermillion hover:bg-vermillion-bg ',
          iconColor: 'text-vermillion',
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
        }
      : null,
    draftCount > 0
      ? {
          label: `${draftCount} draft${draftCount !== 1 ? 's' : ''} to review`,
          icon: FileEdit,
          href: '/commitments?tab=drafts',
          color:
            'bg-ds-accent-bg text-ds-accent border-ds-accent hover:bg-ds-accent-bg ',
          iconColor: 'text-ds-accent',
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
