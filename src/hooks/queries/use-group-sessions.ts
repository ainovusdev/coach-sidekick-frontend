import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { GroupSessionService } from '@/services/group-session-service'
import { GroupSessionFilters } from '@/types/group-session'

export function useGroupSessions(filters?: GroupSessionFilters) {
  return useQuery({
    queryKey: queryKeys.groupSessions.list(filters),
    queryFn: () => GroupSessionService.listGroupSessions(filters),
  })
}
