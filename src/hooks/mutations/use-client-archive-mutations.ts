import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ClientService } from '@/services/client-service'
import { queryKeys } from '@/lib/query-client'

interface ArchiveVars {
  clientId: string
  name?: string
}

/**
 * Archive / unarchive a client (coach side). Archiving only hides the client
 * from lists and dropdowns, so there is no confirm dialog — the toast carries
 * an Undo instead. Invalidates every client query (lists, simple, details).
 */
export function useClientArchive() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })

  const unarchive = useMutation({
    mutationFn: ({ clientId }: ArchiveVars) =>
      ClientService.unarchiveClient(clientId),
    onSuccess: (_data, { name }) => {
      invalidate()
      toast.success(name ? `${name} restored` : 'Client restored')
    },
    onError: (error: Error) => {
      toast.error('Could not unarchive client', { description: error.message })
    },
  })

  const archive = useMutation({
    mutationFn: ({ clientId }: ArchiveVars) =>
      ClientService.archiveClient(clientId),
    onSuccess: (_data, vars) => {
      invalidate()
      toast.success(vars.name ? `${vars.name} archived` : 'Client archived', {
        description: 'Hidden from your client list. Nothing was deleted.',
        action: {
          label: 'Undo',
          onClick: () => unarchive.mutate(vars),
        },
      })
    },
    onError: (error: Error) => {
      toast.error('Could not archive client', { description: error.message })
    },
  })

  return { archive, unarchive }
}
