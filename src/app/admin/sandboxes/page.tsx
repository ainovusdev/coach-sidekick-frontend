'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Boxes, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDebouncedValue, useSandboxes } from '@/hooks/queries/use-sandboxes'
import {
  fmtTerm,
  listNames,
  STATUS_CLASS,
  STATUS_LABEL,
} from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { SandboxStatus } from '@/types/sandbox'

type StatusFilter = 'all' | SandboxStatus

export default function SandboxesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [showEnded, setShowEnded] = useState(false)
  const q = useDebouncedValue(search.trim(), 250)

  const filters = useMemo(
    () => ({
      q: q || undefined,
      status: status === 'all' ? undefined : status,
      include_ended: showEnded || status === 'ended' || undefined,
    }),
    [q, status, showEnded],
  )
  const { data, isLoading, isError } = useSandboxes(filters)
  const rows = data?.sandboxes ?? []
  const isFiltered = !!q || status !== 'all'

  return (
    <div className="space-y-6" data-testid="sandboxes-page">
      <PageHeader
        title="Sandboxes"
        description="A client's coaching contract: term, team, groups and invitations."
        icon={Boxes}
        actions={
          <Button asChild className="bg-ink text-ink-on-dark hover:bg-ink/90">
            <Link href="/admin/sandboxes/new" data-testid="new-sandbox">
              <Plus className="h-4 w-4" />
              New sandbox
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or organisation"
            className="pl-9"
            aria-label="Search sandboxes"
          />
        </div>
        <Select
          value={status}
          onValueChange={v => setStatus(v as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-40" aria-label="Status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Switch
            id="show-ended"
            checked={showEnded || status === 'ended'}
            disabled={status === 'ended'}
            onCheckedChange={setShowEnded}
          />
          <Label htmlFor="show-ended" className="text-sm text-ink-2">
            Show ended
          </Label>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-paper overflow-hidden">
        {isLoading ? (
          <SandboxTableSkeleton />
        ) : isError ? (
          <EmptyState
            icon={Boxes}
            title="Couldn't load sandboxes"
            description="Refresh the page to try again."
          />
        ) : rows.length === 0 ? (
          isFiltered ? (
            <EmptyState
              icon={Search}
              title="No sandboxes match"
              description="Try a different name or clear the filters."
              secondaryAction={{
                label: 'Clear filters',
                onClick: () => {
                  setSearch('')
                  setStatus('all')
                },
              }}
            />
          ) : (
            <EmptyState
              icon={Boxes}
              title="No sandboxes yet"
              description="A sandbox holds one client's coaching contract: the term, the team on both sides, the groups and who gets invited. Start with the term; nothing is emailed until you say so."
              action={{
                label: 'New sandbox',
                icon: Plus,
                onClick: () => router.push('/admin/sandboxes/new'),
              }}
            />
          )
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sandbox</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Owner</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Account executive
                </TableHead>
                <TableHead className="text-right">Groups</TableHead>
                <TableHead className="text-right">Coachees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(s => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  data-testid="sandbox-row"
                  onClick={() => router.push(`/admin/sandboxes/${s.id}`)}
                >
                  <TableCell>
                    <div className="font-medium text-ink">{s.name}</div>
                    <div className="text-xs text-ink-3">{s.organisation}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-ink-2">
                    {fmtTerm(s.term_start, s.term_months)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_CLASS[s.status],
                      )}
                    >
                      {STATUS_LABEL[s.status]}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-ink-2">
                    {s.owner_names.length ? (
                      listNames(s.owner_names, 2)
                    ) : (
                      <span className="text-ink-4">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-ink-2">
                    {listNames(s.account_executive_names, 2)}
                  </TableCell>
                  <TableCell className="text-right text-ink-2">
                    {s.group_count}
                    {s.incomplete_group_count > 0 && (
                      <span className="ml-1.5 text-xs text-amber-token">
                        {s.incomplete_group_count} incomplete
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-ink-2">
                    {s.coachee_count}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

function SandboxTableSkeleton() {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 px-4 py-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-36 hidden sm:block" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  )
}
