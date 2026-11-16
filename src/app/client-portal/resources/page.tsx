'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, CalendarDays, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ResourceDetailDialog,
  ResourceRow,
} from '@/components/client-portal/recent-resources-widget'
import { OwnUploadActions } from '@/components/client-portal/own-upload-actions'
import { UploadResourceDialog } from '@/components/client-portal/upload-resource-dialog'
import { useClientResources } from '@/hooks/queries/use-client-resources'
import type { ClientResource } from '@/types/resource'

function SessionChip({ sessionId }: { sessionId?: string | null }) {
  if (!sessionId) return null
  return (
    <Link
      href={`/client-portal/sessions/${sessionId}`}
      className="inline-flex items-center gap-1 text-[11px] text-ink-3 hover:text-ink-2 hover:underline"
      onClick={e => e.stopPropagation()}
    >
      <CalendarDays className="h-3 w-3" />
      Session
    </Link>
  )
}

function Section({
  title,
  empty,
  rows,
  loading,
  onView,
  action,
}: {
  title: string
  empty: string
  rows: ClientResource[]
  loading: boolean
  onView: (id: string) => void
  action?: React.ReactNode
}) {
  return (
    <Card className="border-line">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">
            {title}
            {!loading && rows.length > 0 && (
              <span className="ml-1.5 font-normal text-ink-4">
                {rows.length}
              </span>
            )}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-3">{empty}</p>
        ) : (
          <div className="divide-y divide-line">
            {rows.map(r => (
              <ResourceRow
                key={r.id}
                resource={r}
                onViewDetail={onView}
                meta={<SessionChip sessionId={r.session_id} />}
                actions={r.is_mine ? <OwnUploadActions resource={r} /> : null}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ClientResourcesPage() {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewing, setViewing] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useClientResources({
    search: debounced || undefined,
    limit: 100,
  })

  const { fromCoach, mine } = useMemo(() => {
    const all = data?.resources ?? []
    return {
      fromCoach: all.filter(r => !r.is_mine),
      mine: all.filter(r => r.is_mine),
    }
  }, [data])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
      <PageHeader
        title="Resources"
        description="What your coach has shared with you, and the files and links you've added."
        icon={BookOpen}
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add a resource
          </Button>
        }
      />

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search resources"
          className="pl-9"
          aria-label="Search resources"
        />
      </div>

      <div className="space-y-6">
        <Section
          title="Your uploads"
          rows={mine}
          loading={isLoading}
          onView={setViewing}
          empty={
            debounced
              ? 'No uploads match your search.'
              : 'Nothing yet. Add a file or link to share it with your coach, or keep it private.'
          }
        />
        <Section
          title="From your coach"
          rows={fromCoach}
          loading={isLoading}
          onView={setViewing}
          empty={
            debounced
              ? 'No resources match your search.'
              : 'Your coach hasn’t shared anything yet.'
          }
        />
      </div>

      <UploadResourceDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <ResourceDetailDialog
        resourceId={viewing}
        open={!!viewing}
        onOpenChange={open => !open && setViewing(null)}
      />
    </div>
  )
}
