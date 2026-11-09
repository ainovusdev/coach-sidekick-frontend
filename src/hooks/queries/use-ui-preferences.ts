import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { PreferencesService } from '@/services/preferences.service'

/**
 * The signed-in person's UI settings. Callers merge the result over
 * DEFAULT_UI_PREFERENCES, so an error (endpoint not deployed yet, signed out)
 * just means the defaults.
 */
export function useUiPreferences(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.preferences.ui(userId),
    queryFn: () => PreferencesService.getUiPreferences(),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    retry: false,
  })
}
