'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ClientResourceService } from '@/services/client-resource-service'
import type { ClientUploadUpdate } from '@/types/resource'

function useInvalidateClientResources() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['client-resources'] })
    queryClient.invalidateQueries({ queryKey: ['client-resource'] })
  }
}

export function useUploadClientResource() {
  const invalidate = useInvalidateClientResources()
  return useMutation({
    mutationFn: ({
      formData,
      onProgress,
    }: {
      formData: FormData
      onProgress?: (percent: number) => void
    }) => ClientResourceService.uploadResource(formData, onProgress),
    onSuccess: resource => {
      invalidate()
      toast.success(
        resource.is_private ? 'Saved privately' : 'Shared with your coach',
        { description: resource.title },
      )
    },
    onError: (err: Error) => {
      toast.error("Couldn't upload", { description: err.message })
    },
  })
}

export function useUpdateClientResource() {
  const invalidate = useInvalidateClientResources()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientUploadUpdate }) =>
      ClientResourceService.updateResource(id, data),
    onSuccess: invalidate,
  })
}

export function useDeleteClientResource() {
  const invalidate = useInvalidateClientResources()
  return useMutation({
    mutationFn: (id: string) => ClientResourceService.deleteResource(id),
    onSuccess: () => {
      invalidate()
      toast.success('Resource removed')
    },
  })
}
