'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { Commitment, CommitmentType } from '@/types/commitment'
import {
  COMMITMENT_TABS,
  CommitmentGroup,
  CommitmentGroupBy,
  CommitmentSort,
  CommitmentTab,
  DueFilter,
  SORT_COMPARATORS,
  groupCommitments,
  matchesDueFilter,
  matchesSearch,
  matchesTab,
} from '../utils/commitment-view'

export interface CommitmentSection {
  key: 'mine' | 'clients'
  label: string
  commitments: Commitment[]
}

/**
 * State + derived data for the commitments hub.
 *
 * `tab`, `client` and `due` live in the URL so the dashboard's overdue chip
 * (and any future surface) can deep-link into a pre-filtered view. Search,
 * sort and grouping are ephemeral local state.
 */
export function useCommitmentsView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { userId } = useAuth()

  // --- URL-backed state ---
  const tabParam = searchParams.get('tab') as CommitmentTab | null
  const tab: CommitmentTab =
    tabParam && COMMITMENT_TABS.includes(tabParam) ? tabParam : 'all'
  const clientFilter = searchParams.get('client') || 'all'
  const dueParam = searchParams.get('due')
  const dueFilter: DueFilter =
    dueParam === 'overdue' || dueParam === 'soon' ? dueParam : null

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null) params.delete(key)
      else params.set(key, value)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const setTab = useCallback(
    (t: CommitmentTab) => setParam('tab', t === 'all' ? null : t),
    [setParam],
  )
  const setClientFilter = useCallback(
    (id: string) => setParam('client', id === 'all' ? null : id),
    [setParam],
  )
  const toggleOverdueFilter = useCallback(
    () => setParam('due', dueFilter === 'overdue' ? null : 'overdue'),
    [setParam, dueFilter],
  )
  const clearDueFilter = useCallback(() => setParam('due', null), [setParam])

  // --- Local state ---
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 200)
    return () => clearTimeout(t)
  }, [searchInput])

  const [sort, setSort] = useState<CommitmentSort>('smart')
  const [groupBy, setGroupBy] = useState<CommitmentGroupBy>('none')
  const [typeFilter, setTypeFilter] = useState<CommitmentType | 'all'>('all')

  // --- Data (keep the filter object identical to other surfaces so the
  // query key stays shared with the client profile / portal caches) ---
  const { data: commitmentsData, isLoading } = useCommitments({
    include_drafts: true,
    my_clients_only: true,
  })

  const allCommitments = useMemo(
    () => commitmentsData?.commitments ?? [],
    [commitmentsData],
  )

  // --- Pipeline: filter → sort → section/group ---
  const filteredCommitments = useMemo(() => {
    return allCommitments.filter(
      c =>
        matchesTab(c, tab) &&
        (clientFilter === 'all' || c.client_id === clientFilter) &&
        (typeFilter === 'all' || c.type === typeFilter) &&
        matchesDueFilter(c, dueFilter) &&
        matchesSearch(c, search),
    )
  }, [allCommitments, tab, clientFilter, typeFilter, dueFilter, search])

  const isMine = useCallback(
    (c: Commitment) =>
      userId ? c.assigned_to_id === userId : !!c.is_coach_commitment,
    [userId],
  )

  const sections = useMemo<CommitmentSection[]>(() => {
    if (groupBy !== 'none') return []
    const comparator = SORT_COMPARATORS[sort]
    const mine = filteredCommitments.filter(isMine).sort(comparator)
    const clients = filteredCommitments.filter(c => !isMine(c)).sort(comparator)
    const result: CommitmentSection[] = []
    if (mine.length > 0)
      result.push({ key: 'mine', label: 'My commitments', commitments: mine })
    if (clients.length > 0)
      result.push({
        key: 'clients',
        label: 'Client commitments',
        commitments: clients,
      })
    return result
  }, [filteredCommitments, groupBy, sort, isMine])

  const groups = useMemo<CommitmentGroup[]>(() => {
    if (groupBy === 'none') return []
    return groupCommitments(filteredCommitments, groupBy, sort)
  }, [filteredCommitments, groupBy, sort])

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

  const visibleDraftIds = useMemo(
    () => filteredCommitments.filter(c => c.status === 'draft').map(c => c.id),
    [filteredCommitments],
  )

  const hasActiveFilters =
    tab !== 'all' ||
    clientFilter !== 'all' ||
    typeFilter !== 'all' ||
    dueFilter !== null ||
    search.trim() !== ''

  const clearAllFilters = useCallback(() => {
    setSearchInput('')
    setTypeFilter('all')
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  return {
    // URL-backed state
    tab,
    setTab,
    clientFilter,
    setClientFilter,
    dueFilter,
    toggleOverdueFilter,
    clearDueFilter,
    // local state
    searchInput,
    setSearchInput,
    sort,
    setSort,
    groupBy,
    setGroupBy,
    typeFilter,
    setTypeFilter,
    // data
    isLoading,
    allCommitments,
    filteredCommitments,
    sections,
    groups,
    counts,
    visibleDraftIds,
    hasActiveFilters,
    clearAllFilters,
  }
}
