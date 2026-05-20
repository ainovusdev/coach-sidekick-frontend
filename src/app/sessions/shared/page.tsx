'use client'

import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/page-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { SharedSessionRow } from '@/components/sessions/shared-session-row'
import { Users, MessageSquare } from 'lucide-react'
import { useSessions } from '@/hooks/queries/use-sessions'

export default function SharedSessionsPage() {
  const router = useRouter()
  const { data, isLoading, error, refetch } = useSessions(
    { scope: 'shared', per_page: 50 },
    { staleTime: 60 * 1000 },
  )

  const sessions = data?.sessions ?? []

  return (
    <ProtectedRoute loadingMessage="Loading shared sessions...">
      <PageLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeader
            title="Shared with me"
            description="Coaching sessions other coaches have shared with you for review."
            icon={Users}
          />

          <div className="mt-6">
            {error && !isLoading && (
              <Card>
                <CardContent className="p-6">
                  <EmptyState
                    icon={MessageSquare}
                    title="Couldn't load shared sessions"
                    description={
                      error instanceof Error
                        ? error.message
                        : 'Please try again.'
                    }
                    action={{
                      label: 'Try again',
                      onClick: () => refetch(),
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Skeleton className="w-full sm:w-64 aspect-video rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-2/3" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && !error && sessions.length === 0 && (
              <Card>
                <CardContent className="p-10">
                  <EmptyState
                    icon={Users}
                    title="Nothing shared yet"
                    description="When other coaches share sessions for you to review, they'll show up here."
                  />
                </CardContent>
              </Card>
            )}

            {!isLoading && sessions.length > 0 && (
              <div className="space-y-3">
                {sessions.map((s: any) => (
                  <SharedSessionRow
                    key={s.id}
                    session={s}
                    onOpen={id => router.push(`/sessions/${id}/review`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
