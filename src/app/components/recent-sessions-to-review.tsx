'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'
import { useSessions } from '@/hooks/queries/use-sessions'
import { SharedSessionRow } from '@/components/sessions/shared-session-row'

/**
 * Surfaces the 3 most recently shared-with-me sessions on the homepage so a
 * coach lands and sees what's waiting for their review. Renders nothing when
 * there's nothing to review — no empty state, no loading skeleton, just
 * absent — so the dashboard doesn't carry dead real estate for coaches who
 * never receive shares.
 */
export function RecentSessionsToReview() {
  const router = useRouter()
  const { data, isLoading, error } = useSessions(
    { scope: 'shared', per_page: 3 },
    { staleTime: 60 * 1000 },
  )

  // Hide the section entirely on first load, errors, or empty results — the
  // homepage shouldn't carry real estate for a feature the user isn't using.
  if (isLoading || error) return null
  const sessions = data?.sessions ?? []
  if (sessions.length === 0) return null

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Recent sessions to review
          </h2>
        </div>
        <Link
          href="/sessions/shared"
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {sessions.map((s: any) => (
          <SharedSessionRow
            key={s.id}
            session={s}
            onOpen={id => router.push(`/sessions/${id}/review`)}
          />
        ))}
      </div>
    </section>
  )
}
