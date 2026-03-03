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

export function useGroupSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groupSessions.detail(sessionId!),
    queryFn: () => GroupSessionService.getGroupSession(sessionId!),
    enabled: !!sessionId,
  })
}

export function useGroupSessionParticipants(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groupSessions.participants(sessionId!),
    queryFn: () => GroupSessionService.getParticipants(sessionId!),
    enabled: !!sessionId,
  })
}
