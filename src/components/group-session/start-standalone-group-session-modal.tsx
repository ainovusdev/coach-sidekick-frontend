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
import { Users, Search, Loader2 } from 'lucide-react'
import { useClientsSimple } from '@/hooks/queries/use-clients'
import { useCreateGroupSession } from '@/hooks/mutations/use-group-session-mutations'
import { MeetingService } from '@/services/meeting-service'

interface StartStandaloneGroupSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StartStandaloneGroupSessionModal({
  open,
  onOpenChange,
}: StartStandaloneGroupSessionModalProps) {
  const router = useRouter()
  const { data: clientsData, isLoading: loadingClients } = useClientsSimple()
  const clients = clientsData?.clients || []

  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(
    new Set(),
  )
  const [title, setTitle] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const createMutation = useCreateGroupSession()

  const filteredClients = clients.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()),
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
    if (selectedClientIds.size === filteredClients.length) {
      setSelectedClientIds(new Set())
    } else {
      setSelectedClientIds(new Set(filteredClients.map(c => c.id)))
    }
  }

  const [creatingBot, setCreatingBot] = useState(false)

  const handleCreate = async () => {
    const result = await createMutation.mutateAsync({
      client_ids: Array.from(selectedClientIds),
      title: title || undefined,
      meeting_url: meetingUrl || undefined,
    })
    handleClose()

    if (meetingUrl) {
      // Create a Recall.ai bot attached to the group session
      try {
        setCreatingBot(true)
        const botResult = await MeetingService.createBot({
          meeting_url: meetingUrl,
          session_id: result.id,
          bot_name: title || 'Group Session',
        })
        router.push(`/meeting/${botResult.id}`)
      } catch {
        // Bot creation failed — fall back to session detail page
        router.push(`/sessions/group/${result.id}`)
      } finally {
        setCreatingBot(false)
      }
    } else {
      router.push(`/sessions/group/${result.id}`)
    }
  }

  const handleClose = () => {
    setSelectedClientIds(new Set())
    setTitle('')
    setMeetingUrl('')
    setSearchQuery('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Start Group Session
          </DialogTitle>
          <DialogDescription>
            Select clients to include in this group session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="standalone-title">Session Title (optional)</Label>
            <Input
              id="standalone-title"
              placeholder="Group Session"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="standalone-meetingUrl">
              Meeting URL (optional)
            </Label>
            <Input
              id="standalone-meetingUrl"
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
              {filteredClients.length > 0 && (
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selectedClientIds.size === filteredClients.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              )}
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[200px] border rounded-md p-2">
              {loadingClients ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredClients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchQuery ? 'No clients found' : 'No clients available'}
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredClients.map(client => (
                    <label
                      key={client.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedClientIds.has(client.id)}
                        onCheckedChange={() => toggleClient(client.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {client.name}
                        </p>
                        {client.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {client.email}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedClientIds.size === 1 && (
              <p className="text-xs text-amber-600 mt-1">
                Select at least 2 clients for a group session
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
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
