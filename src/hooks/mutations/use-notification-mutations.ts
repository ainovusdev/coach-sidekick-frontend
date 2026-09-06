import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-client'
import { NotificationService } from '@/services/notification-service'
import type { NotificationSettings } from '@/types/notifications'

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => NotificationService.markRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => NotificationService.markAllRead(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  })
}

/** Flip the email half on or off. Optimistic: the switch moves at once. */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()
  const key = queryKeys.notifications.settings()
  return useMutation({
    mutationFn: (emailEnabled: boolean) =>
      NotificationService.updateSettings(emailEnabled),
    onMutate: async emailEnabled => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<NotificationSettings>(key)
      if (previous) {
        queryClient.setQueryData<NotificationSettings>(key, {
          ...previous,
          email_enabled: emailEnabled,
        })
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error('Could not save your notification setting')
    },
    onSuccess: data => queryClient.setQueryData(key, data),
  })
}
