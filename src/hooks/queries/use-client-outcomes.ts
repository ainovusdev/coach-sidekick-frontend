'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ClientOutcomeService,
  ClientOutcomeCreate,
} from '@/services/client-outcome-service'
import { toast } from 'sonner'

export function useClientGoals() {
  return useQuery({
    queryKey: ['client-goals'],
    queryFn: () => ClientOutcomeService.listGoals(),
  })
}

export function useClientOutcomes(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['client-outcomes', filters],
    queryFn: () => ClientOutcomeService.listOutcomes(filters),
  })
}

export function useClientOutcome(id: string) {
  return useQuery({
    queryKey: ['client-outcome', id],
    queryFn: () => ClientOutcomeService.getOutcome(id),
    enabled: !!id,
  })
}

export function useCreateClientOutcome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClientOutcomeCreate) =>
      ClientOutcomeService.createOutcome(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-outcomes'] })
      toast.success('Outcome created!')
    },
    onError: () => {
      toast.error('Failed to create outcome')
    },
  })
}
