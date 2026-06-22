import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  adminService,
  MergePreview,
  MergeResult,
} from '@/services/admin-service'
import { invalidateAdminQueries } from '@/lib/query-client'

interface MergeVars {
  sourceUserId: string
  targetUserId: string
}

/**
 * Read-only preview of an account merge (what would move, plus any warnings or
 * blocking errors). Run on demand from the merge page.
 */
export function usePreviewMerge() {
  return useMutation<MergePreview, any, MergeVars>({
    mutationFn: ({ sourceUserId, targetUserId }) =>
      adminService.previewMerge(sourceUserId, targetUserId),
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to preview merge')
    },
  })
}

/**
 * Execute the merge (re-parent the duplicate's profiles onto the primary,
 * soft-deactivate the duplicate, notify its owner).
 */
export function useExecuteMerge() {
  const queryClient = useQueryClient()

  return useMutation<MergeResult, any, MergeVars>({
    mutationFn: ({ sourceUserId, targetUserId }) =>
      adminService.executeMerge(sourceUserId, targetUserId),
    onSuccess: () => {
      toast.success('Profiles merged successfully')
      invalidateAdminQueries.afterUserUpdate(queryClient)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to merge profiles')
    },
  })
}
