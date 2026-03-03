'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, Search } from 'lucide-react'
import { useCreateGroupSession } from '@/hooks/mutations/use-group-session-mutations'
import { MeetingService } from '@/services/meeting-service'

interface StartGroupSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  programId: string
  programName: string
  members: Array<{
    client_id: string
    client_name: string
    client_email: string | null
  }>
}

export function StartGroupSessionModal({
  open,
  onOpenChange,
  programId,
  programName,
  members,
}: StartGroupSessionModalProps) {
  const router = useRouter()
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(
    new Set(),
  )
  const [title, setTitle] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const createMutation = useCreateGroupSession()
  const [creatingBot, setCreatingBot] = useState(false)

  const filteredMembers = members.filter(
    m =>
      m.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.client_email || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleClient = (clientId: string) => {
    setSelectedClientIds(prev => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selectedClientIds.size === members.length) {
      setSelectedClientIds(new Set())
    } else {
      setSelectedClientIds(new Set(members.map(m => m.client_id)))
    }
  }

  const handleCreate = async () => {
    const result = await createMutation.mutateAsync({
      program_id: programId,
      client_ids: Array.from(selectedClientIds),
      title: title || undefined,
      meeting_url: meetingUrl || undefined,
    })
    onOpenChange(false)

    if (meetingUrl) {
      try {
        setCreatingBot(true)
        const botResult = await MeetingService.createBot({
          meeting_url: meetingUrl,
          session_id: result.id,
          bot_name: title || `Group Session - ${programName}`,
        })
        router.push(`/meeting/${botResult.id}`)
      } catch {
        router.push(`/sessions/group/${result.id}`)
      } finally {
        setCreatingBot(false)
      }
    } else {
      router.push(`/sessions/group/${result.id}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Start Group Session
          </DialogTitle>
          <DialogDescription>
            Select clients from {programName} to include in this group session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Session Title (optional)</Label>
            <Input
              id="title"
              placeholder={`Group Session - ${programName}`}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="meetingUrl">Meeting URL (optional)</Label>
            <Input
              id="meetingUrl"
              placeholder="https://zoom.us/j/..."
              value={meetingUrl}
              onChange={e => setMeetingUrl(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>
                Select Participants ({selectedClientIds.size} selected)
              </Label>
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedClientIds.size === members.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            {members.length > 5 && (
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}

            <ScrollArea className="h-[200px] border rounded-md p-2">
              {filteredMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members found
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredMembers.map(member => (
                    <label
                      key={member.client_id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedClientIds.has(member.client_id)}
                        onCheckedChange={() => toggleClient(member.client_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.client_name}
                        </p>
                        {member.client_email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {member.client_email}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              selectedClientIds.size < 2 ||
              createMutation.isPending ||
              creatingBot
            }
          >
            {createMutation.isPending || creatingBot
              ? 'Creating...'
              : `Start Session (${selectedClientIds.size} clients)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
