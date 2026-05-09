import { useQuery } from '@tanstack/react-query'
import { CalendarService } from '@/services/calendar-service'
import { queryKeys } from '@/lib/query-client'
import type { CalendarConnectionStatus } from '@/types/calendar'

export function useCalendarConnection() {
  return useQuery<CalendarConnectionStatus>({
    queryKey: queryKeys.calendar.status(),
    queryFn: () => CalendarService.getStatus(),
    staleTime: 30 * 1000,
  })
}
