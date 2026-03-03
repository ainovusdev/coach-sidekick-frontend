'use client'

import { useSessionNotes } from '@/hooks/queries/use-sessions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText } from 'lucide-react'

interface GroupNotesTabProps {
  masterSessionId: string
  isActive: boolean
}

interface Note {
  id: string
  title?: string | null
  content: string
  note_type: string
  created_at?: string | null
  updated_at?: string | null
}

const noteTypeLabels: Record<string, string> = {
  coach_private: 'Coach Private',
  shared: 'Shared',
  action_item: 'Action Item',
  observation: 'Observation',
  follow_up: 'Follow Up',
}

export function GroupNotesTab({
  masterSessionId,
  isActive,
}: GroupNotesTabProps) {
  const { data: notes, isLoading } = useSessionNotes(masterSessionId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  const notesList: Note[] = Array.isArray(notes) ? notes : []

  if (notesList.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No group-level notes yet.
            {isActive &&
              ' Notes added during the live session will appear here.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        {notesList.length} note{notesList.length !== 1 ? 's' : ''} on group
        session
      </div>

      {notesList.map((note: Note) => (
        <Card key={note.id}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {note.title && (
                  <p className="text-sm font-medium mb-1">{note.title}</p>
                )}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {noteTypeLabels[note.note_type] ||
                  note.note_type.replace('_', ' ')}
              </Badge>
            </div>
            {note.created_at && (
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(note.created_at).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
