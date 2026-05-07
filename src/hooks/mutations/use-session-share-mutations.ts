import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { SessionSharesService } from '@/services/session-shares-service'
import { queryKeys } from '@/lib/query-client'

export function useShareSession(sessionId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.sessionShares.list(sessionId)

  return useMutation({
    mutationFn: (userIds: string[]) =>
      SessionSharesService.add(sessionId, userIds),
    onSuccess: data => {
      queryClient.setQueryData(key, data)
      toast.success(
        data.shares.length === 1
          ? 'Shared with 1 coach'
          : `Shared with ${data.shares.length} coaches`,
      )
    },
    onError: err => {
      toast.error('Could not share session', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
  })
}

export function useRevokeShare(sessionId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.sessionShares.list(sessionId)

  return useMutation({
    mutationFn: (shareId: string) =>
      SessionSharesService.revoke(sessionId, shareId),
    onMutate: async shareId => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<any>(key)
      queryClient.setQueryData<any>(key, (old: any) => {
        if (!old) return old
        return {
          ...old,
          shares: (old.shares ?? []).filter((s: any) => s.id !== shareId),
        }
      })
      return { previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error('Could not revoke share', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export function useToggleShareWithAll(sessionId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.sessionShares.list(sessionId)

  return useMutation({
    mutationFn: (shareWithAll: boolean) =>
      SessionSharesService.toggleShareWithAll(sessionId, shareWithAll),
    onMutate: async shareWithAll => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<any>(key)
      queryClient.setQueryData<any>(key, (old: any) => {
        if (!old)
          return { is_shared_with_all_coaches: shareWithAll, shares: [] }
        return { ...old, is_shared_with_all_coaches: shareWithAll }
      })
      return { previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error('Could not change sharing setting', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
    onSuccess: data => {
      queryClient.setQueryData(key, data)
    },
  })
}
