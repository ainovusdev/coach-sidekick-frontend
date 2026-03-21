'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ResourceService } from '@/services/resource-service'
import { ClientResourceService } from '@/services/client-resource-service'
import type {
  SharedResourceUpdate,
  ResourceShareRequest,
} from '@/types/resource'
import { toast } from 'sonner'

export function useCreateResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      formData,
      onProgress,
    }: {
      formData: FormData
      onProgress?: (percent: number) => void
    }) => ResourceService.createResource(formData, onProgress),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      toast.success('Resource created', { description: data.title })
    },
    onError: err => {
      toast.error('Failed to create resource', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
  })
}

export function useUpdateResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SharedResourceUpdate }) =>
      ResourceService.updateResource(id, data),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resource', data.id] })
      toast.success('Resource updated')
    },
    onError: err => {
      toast.error('Failed to update resource', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
  })
}

export function useDeleteResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ResourceService.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      toast.success('Resource deleted')
    },
    onError: err => {
      toast.error('Failed to delete resource', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
  })
}

export function useShareResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResourceShareRequest }) =>
      ResourceService.shareResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['client-resources'] })
      toast.success('Resource shared')
    },
    onError: err => {
      toast.error('Failed to share resource', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
  })
}

export function useUnshareResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      resourceId,
      shareId,
    }: {
      resourceId: string
      shareId: string
    }) => ResourceService.unshareResource(resourceId, shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['client-resources'] })
      toast.success('Share removed')
    },
    onError: err => {
      toast.error('Failed to remove share', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
  })
}

export function useTrackResourceDownload() {
  return useMutation({
    mutationFn: (id: string) => ClientResourceService.trackDownload(id),
  })
}
