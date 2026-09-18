import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { NotificationService } from '@/services/notification-service'

/** The bell's list. Polls gently; the bell is open only a moment at a time. */
export function useNotifications(enabled = true, unreadOnly = false) {
  return useQuery({
    queryKey: queryKeys.notifications.list(unreadOnly),
    queryFn: () => NotificationService.list(unreadOnly),
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useUnreadNotifications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.unread(),
    queryFn: () => NotificationService.unreadCount(),
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

/** The person's email switch — fetched only while the bell is open. */
export function useNotificationSettings(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.settings(),
    queryFn: () => NotificationService.settings(),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
