import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SessionNotesService } from '@/services/session-notes-service'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import { nowUTC } from '@/lib/date-utils'

export interface NoteCreate {
  note_type: 'coach_private' | 'shared'
  title: string
  content: string
  tags?: string[]
}

/**
 * Hook to create a new note with optimistic updates
 *
 * @example
 * const createNote = useCreateNote(sessionId)
 * await createNote.mutateAsync({
 *   note_type: 'coach_private',
 *   title: 'Quick note',
 *   content: 'Important insight...'
 * })
 */
export function useCreateNote(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: NoteCreate) =>
      SessionNotesService.createNote(sessionId, data),

    onMutate: async newNote => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.sessions.notes(sessionId),
      })

      // Snapshot previous value
      const previousNotes = queryClient.getQueryData(
        queryKeys.sessions.notes(sessionId),
      )

      // Optimistically update with temporary ID
      const timestamp = nowUTC()
      const optimisticNote = {
        id: `temp-${Date.now()}`,
        ...newNote,
        created_at: timestamp,
        updated_at: timestamp,
        is_pinned: false,
        transcript_timestamp: null,
        transcript_entry_id: null,
        from_template_id: null,
        template_sections: null,
        note_metadata: null,
      }

      queryClient.setQueryData(
        queryKeys.sessions.notes(sessionId),
        (old: any) => {
          if (!old) return [optimisticNote]
          return [optimisticNote, ...old]
        },
      )

      return { previousNotes }
    },

    onError: (err, _newNote, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(
          queryKeys.sessions.notes(sessionId),
          context.previousNotes,
        )
      }

      toast.error('Failed to save note', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: () => {
      toast.success('Note saved', {
        description: 'Your note has been saved',
      })
    },

    onSettled: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.notes(sessionId),
      })
    },
  })
}

/**
 * Hook to update an existing note with optimistic updates
 */
export function useUpdateNote(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      noteId,
      data,
    }: {
      noteId: string
      data: Partial<NoteCreate>
    }) => SessionNotesService.updateNote(noteId, data),

    onMutate: async ({ noteId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.sessions.notes(sessionId),
      })

      // Snapshot previous value
      const previousNotes = queryClient.getQueryData(
        queryKeys.sessions.notes(sessionId),
      )

      // Optimistically update the note in the list
      queryClient.setQueryData(
        queryKeys.sessions.notes(sessionId),
        (old: any) => {
          if (!Array.isArray(old)) return old
          return old.map((note: any) =>
            note.id === noteId
              ? { ...note, ...data, updated_at: nowUTC() }
              : note,
          )
        },
      )

      return { previousNotes, noteId }
    },

    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(
          queryKeys.sessions.notes(sessionId),
          context.previousNotes,
        )
      }

      toast.error('Failed to update note', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: () => {
      toast.success('Note updated')
    },

    onSettled: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.notes(sessionId),
      })
    },
  })
}

/**
 * Hook to delete a note
 */
export function useDeleteNote(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (noteId: string) => SessionNotesService.deleteNote(noteId),

    onMutate: async noteId => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.sessions.notes(sessionId),
      })

      const previousNotes = queryClient.getQueryData(
        queryKeys.sessions.notes(sessionId),
      )

      // Optimistically remove
      queryClient.setQueryData(
        queryKeys.sessions.notes(sessionId),
        (old: any) => {
          if (!Array.isArray(old)) return old
          return old.filter((note: any) => note.id !== noteId)
        },
      )

      return { previousNotes }
    },

    onError: (err, _noteId, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(
          queryKeys.sessions.notes(sessionId),
          context.previousNotes,
        )
      }

      toast.error('Failed to delete note', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: () => {
      toast.success('Note deleted')
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.notes(sessionId),
      })
    },
  })
}
