import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { PeopleService } from '@/services/people-service'
import { useDebouncedValue } from '@/hooks/queries/use-sandboxes'
import { peopleContextParam, type PeopleContext } from '@/types/people'

/** People I may pick for this context. Debounced; stays fresh for 30 s. */
export function usePeopleSearch(
  q: string,
  context?: PeopleContext | null,
  enabled = true,
) {
  const debounced = useDebouncedValue(q.trim(), 200)
  const ctx = peopleContextParam(context)
  return useQuery({
    queryKey: queryKeys.people.search(debounced, ctx),
    queryFn: () => PeopleService.search(debounced, ctx),
    enabled,
    staleTime: 30 * 1000,
  })
}
