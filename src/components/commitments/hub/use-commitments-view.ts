'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useViewerId } from '@/hooks/use-viewer-id'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { assigneeOf, isAssignedTo } from '@/lib/commitments/assignee'
import type { PickedPerson } from '@/components/people/person-picker'
import { Commitment, CommitmentStats, CommitmentType } from '@/types/commitment'
import {
  COMMITMENT_GROUP_BYS,
  COMMITMENT_TABS,
  CommitmentGroup,
  CommitmentGroupBy,
  CommitmentSection,
  CommitmentSort,
  CommitmentTab,
  CommitmentView,
  DueFilter,
  SECTION_LABELS,
  SECTION_ORDER,
  SORT_COMPARATORS,
  VIEW_FROM_PARAM,
  VIEW_PARAM,
  groupCommitments,
  isOpen,
  isOverdue,
  matchesAssignee,
  matchesDueFilter,
  matchesSearch,
  matchesTab,
  matchesView,
  sectionOf,
} from './commitment-view'

export type HubAudience = 'coach' | 'admin'

export interface CommitmentSectionData {
  key: CommitmentSection
  label: string
  commitments: Commitment[]
}

/** The coach hub's first query. Keep this object byte-for-byte: its query
 *  key is shared with the client profile and portal caches. */
const COACH_FILTERS = { include_drafts: true, my_clients_only: true } as const
/** Everything I'm on — assignee, creator or assigner — including rows with
 *  no client (a colleague's hand-off) and sandbox rows. */
const INVOLVING_FILTERS = { involving_me: true, include_drafts: true } as const

/**
 * State + derived data for the commitments hub.
 *
 * URL-backed: `tab`, `view` (+ `assignee`), `group`, `client`, `sandbox`,
 * `due`, `open` — so the dashboard chips, the bell and the sandbox cockpit
 * can deep-link into a pre-filtered view, and a chosen commitment survives
 * a reload. Search, sort and type are ephemeral local state.
 */
export function useCommitmentsView(audience: HubAudience) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const userId = useViewerId()

  const defaultView: CommitmentView = audience === 'admin' ? 'others' : 'all'

  // --- URL-backed state ---
  const tabParam = searchParams.get('tab') as CommitmentTab | null
  const tab: CommitmentTab =
    tabParam && COMMITMENT_TABS.includes(tabParam) ? tabParam : 'all'
  const viewParam = searchParams.get('view')
  const view: CommitmentView =
    (viewParam && VIEW_FROM_PARAM[viewParam]) || defaultView
  const assigneeFilter = searchParams.get('assignee') || null
  const groupParam = searchParams.get('group') as CommitmentGroupBy | null
  const groupBy: CommitmentGroupBy =
    groupParam && COMMITMENT_GROUP_BYS.includes(groupParam)
      ? groupParam
      : 'none'
  const clientFilter = searchParams.get('client') || 'all'
  const sandboxFilter = searchParams.get('sandbox') || null
  const dueParam = searchParams.get('due')
  const dueFilter: DueFilter =
    dueParam === 'overdue' || dueParam === 'soon' ? dueParam : null
  const openId = searchParams.get('open') || null

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) params.delete(key)
        else params.set(key, value)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [searchParams, router, pathname],
  )
  const setParam = useCallback(
    (key: string, value: string | null) => setParams({ [key]: value }),
    [setParams],
  )

  const setTab = useCallback(
    (t: CommitmentTab) => setParam('tab', t === 'all' ? null : t),
    [setParam],
  )
  const setView = useCallback(
    (v: CommitmentView) =>
      setParams({
        view: v === defaultView ? null : VIEW_PARAM[v],
        assignee: null,
      }),
    [setParams, defaultView],
  )
  const setGroupBy = useCallback(
    (g: CommitmentGroupBy) => setParam('group', g === 'none' ? null : g),
    [setParam],
  )
  const setClientFilter = useCallback(
    (id: string) => setParam('client', id === 'all' ? null : id),
    [setParam],
  )
  const clearSandboxFilter = useCallback(
    () => setParam('sandbox', null),
    [setParam],
  )
  const toggleOverdueFilter = useCallback(
    () => setParam('due', dueFilter === 'overdue' ? null : 'overdue'),
    [setParam, dueFilter],
  )
  const toggleMineView = useCallback(
    () => setView(view === 'mine' ? 'all' : 'mine'),
    [setView, view],
  )
  const clearDueFilter = useCallback(() => setParam('due', null), [setParam])
  const setOpenId = useCallback(
    (id: string | null) => setParam('open', id),
    [setParam],
  )

  // --- Person filter (`assignee=<userId>`) ---
  // The URL only carries the id; the name comes from the picker when chosen
  // here, else from any loaded row that has this person on it.
  const [pickedPerson, setPickedPerson] = useState<PickedPerson | null>(null)
  const setAssigneeFilter = useCallback(
    (p: PickedPerson | null) => {
      setPickedPerson(p)
      setParams({ assignee: p?.user_id ?? null, view: null })
    },
    [setParams],
  )

  // --- Local state ---
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 200)
    return () => clearTimeout(t)
  }, [searchInput])

  const [sort, setSort] = useState<CommitmentSort>('smart')
  const [typeFilter, setTypeFilter] = useState<CommitmentType | 'all'>('all')

  // --- Data: the coach's client list + everything involving me, unioned ---
  const primary = useCommitments(COACH_FILTERS, {
    enabled: audience === 'coach',
  })
  const involving = useCommitments(INVOLVING_FILTERS)
  const isLoading =
    (audience === 'coach' && primary.isLoading) || involving.isLoading

  const allCommitments = useMemo(() => {
    const seen = new Set<string>()
    const out: Commitment[] = []
    for (const list of [
      primary.data?.commitments ?? [],
      involving.data?.commitments ?? [],
    ]) {
      for (const c of list) {
        if (seen.has(c.id)) continue
        seen.add(c.id)
        out.push(c)
      }
    }
    return out
  }, [primary.data, involving.data])

  const assigneePerson = useMemo<PickedPerson | null>(() => {
    if (!assigneeFilter) return null
    if (pickedPerson?.user_id === assigneeFilter) return pickedPerson
    for (const c of allCommitments) {
      const a = assigneeOf(c)
      if (a?.user_id === assigneeFilter) {
        return {
          user_id: a.user_id,
          client_id: a.client_id,
          name: a.name,
          email: a.email,
          has_account: a.has_account,
          roles: a.roles,
        }
      }
    }
    return {
      user_id: assigneeFilter,
      name: null,
      email: null,
      has_account: true,
      roles: [],
    }
  }, [assigneeFilter, pickedPerson, allCommitments])

  const sandboxName = useMemo(() => {
    if (!sandboxFilter) return null
    return (
      allCommitments.find(c => c.sandbox_id === sandboxFilter)?.sandbox_name ??
      null
    )
  }, [sandboxFilter, allCommitments])

  // --- Pipeline: filter → sort → section/group ---
  const filteredCommitments = useMemo(() => {
    return allCommitments.filter(
      c =>
        matchesTab(c, tab) &&
        (assigneeFilter
          ? matchesAssignee(c, assigneeFilter)
          : matchesView(c, view, userId)) &&
        (clientFilter === 'all' || c.client_id === clientFilter) &&
        (!sandboxFilter || c.sandbox_id === sandboxFilter) &&
        (typeFilter === 'all' || c.type === typeFilter) &&
        matchesDueFilter(c, dueFilter) &&
        matchesSearch(c, search),
    )
  }, [
    allCommitments,
    tab,
    view,
    assigneeFilter,
    userId,
    clientFilter,
    sandboxFilter,
    typeFilter,
    dueFilter,
    search,
  ])

  const sections = useMemo<CommitmentSectionData[]>(() => {
    if (groupBy !== 'none') return []
    const comparator = SORT_COMPARATORS[sort]
    const buckets = new Map<CommitmentSection, Commitment[]>()
    for (const c of filteredCommitments) {
      const key = sectionOf(c, userId)
      const list = buckets.get(key)
      if (list) list.push(c)
      else buckets.set(key, [c])
    }
    return SECTION_ORDER.filter(key => buckets.has(key)).map(key => ({
      key,
      label: SECTION_LABELS[key],
      commitments: buckets.get(key)!.sort(comparator),
    }))
  }, [filteredCommitments, groupBy, sort, userId])

  const groups = useMemo<CommitmentGroup[]>(() => {
    if (groupBy === 'none') return []
    return groupCommitments(filteredCommitments, groupBy, sort, userId)
  }, [filteredCommitments, groupBy, sort, userId])

  // --- Counts for tab badges (from the unfiltered set, like before) ---
  const counts = useMemo(
    () => ({
      all: allCommitments.length,
      active: allCommitments.filter(c => c.status === 'active').length,
      drafts: allCommitments.filter(c => c.status === 'draft').length,
      completed: allCommitments.filter(c => c.status === 'completed').length,
    }),
    [allCommitments],
  )

  /** Open items on me — the "N for you" figure. */
  const forYouCount = useMemo(
    () =>
      allCommitments.filter(
        c => isAssignedTo(c, userId) && isOpen(c) && c.status !== 'draft',
      ).length,
    [allCommitments, userId],
  )

  /** Client-side stats for audiences without the server figure (admin). */
  const derivedStats = useMemo<CommitmentStats>(() => {
    const active = allCommitments.filter(
      c => c.status === 'active' || c.status === 'in_progress',
    ).length
    const completed = counts.completed
    const decided = active + completed
    return {
      total_active: active,
      total_completed: completed,
      completion_rate: decided ? Math.round((completed / decided) * 100) : 0,
      at_risk_count: allCommitments.filter(isOverdue).length,
    }
  }, [allCommitments, counts.completed])

  const visibleDraftIds = useMemo(
    () => filteredCommitments.filter(c => c.status === 'draft').map(c => c.id),
    [filteredCommitments],
  )

  const hasActiveFilters =
    tab !== 'all' ||
    view !== defaultView ||
    assigneeFilter !== null ||
    clientFilter !== 'all' ||
    sandboxFilter !== null ||
    typeFilter !== 'all' ||
    dueFilter !== null ||
    search.trim() !== ''

  const clearAllFilters = useCallback(() => {
    setSearchInput('')
    setTypeFilter('all')
    setPickedPerson(null)
    // Keep the open panel, drop every filter
    setParams({
      tab: null,
      view: null,
      assignee: null,
      group: null,
      client: null,
      sandbox: null,
      due: null,
    })
  }, [setParams])

  return {
    audience,
    defaultView,
    // URL-backed state
    tab,
    setTab,
    view,
    setView,
    toggleMineView,
    assigneeFilter,
    assigneePerson,
    setAssigneeFilter,
    groupBy,
    setGroupBy,
    clientFilter,
    setClientFilter,
    sandboxFilter,
    sandboxName,
    clearSandboxFilter,
    dueFilter,
    toggleOverdueFilter,
    clearDueFilter,
    openId,
    setOpenId,
    // local state
    searchInput,
    setSearchInput,
    sort,
    setSort,
    typeFilter,
    setTypeFilter,
    // data
    isLoading,
    allCommitments,
    filteredCommitments,
    sections,
    groups,
    counts,
    forYouCount,
    derivedStats,
    visibleDraftIds,
    hasActiveFilters,
    clearAllFilters,
  }
}

export type CommitmentsViewState = ReturnType<typeof useCommitmentsView>
