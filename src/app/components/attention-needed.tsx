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

  const items = [
    overdueCount > 0
      ? {
          label: `${overdueCount} overdue`,
          icon: Clock,
          href: '/commitments',
          color:
            'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30',
          iconColor: 'text-red-500',
        }
      : null,
    staleClientCount > 0
      ? {
          label: `${staleClientCount} need${staleClientCount === 1 ? 's' : ''} follow-up`,
          icon: UserX,
          href: '/clients',
          color:
            'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30',
          iconColor: 'text-amber-500',
        }
      : null,
    draftCount > 0
      ? {
          label: `${draftCount} draft${draftCount !== 1 ? 's' : ''} to review`,
          icon: FileEdit,
          href: '/commitments?tab=drafts',
          color:
            'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30',
          iconColor: 'text-blue-500',
        }
      : null,
  ].filter(Boolean) as NonNullable<(typeof items)[number]>[]

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
