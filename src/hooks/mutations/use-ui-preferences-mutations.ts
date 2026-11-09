import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-client'
import { PreferencesService } from '@/services/preferences.service'
import { DEFAULT_UI_PREFERENCES, type UiPreferences } from '@/types/preferences'

/** Change some UI settings. Optimistic: every open editor follows at once. */
export function useUpdateUiPreferences(userId: string | null) {
  const queryClient = useQueryClient()
  const key = queryKeys.preferences.ui(userId)
  return useMutation({
    mutationFn: (patch: Partial<UiPreferences>) =>
      PreferencesService.updateUiPreferences(patch),
    onMutate: async patch => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<UiPreferences>(key)
      queryClient.setQueryData<UiPreferences>(key, {
        ...DEFAULT_UI_PREFERENCES,
        ...previous,
        ...patch,
      })
      return { previous }
    },
    onError: (_error, _patch, context) => {
      queryClient.setQueryData(key, context?.previous)
      toast.error('Could not save your setting')
    },
    onSuccess: data => queryClient.setQueryData(key, data),
  })
}
