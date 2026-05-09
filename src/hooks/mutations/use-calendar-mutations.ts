import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarService } from '@/services/calendar-service'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import type { CalendarSettingsUpdate } from '@/types/calendar'

export function useUpdateCalendarSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CalendarSettingsUpdate) =>
      CalendarService.updateSettings(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all })
      toast.success('Calendar settings updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update calendar settings')
    },
  })
}

export function useDisconnectCalendar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => CalendarService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all })
      toast.success('Google Calendar disconnected')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disconnect calendar')
    },
  })
}
