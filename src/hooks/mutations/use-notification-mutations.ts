import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { NotificationService } from '@/services/notification-service'

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
