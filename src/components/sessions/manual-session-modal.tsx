'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarIcon, User, Upload, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { ManualSessionService } from '@/services/manual-session-service'
import { ClientService } from '@/services/client-service'
import { toast } from '@/hooks/use-toast'

interface ManualSessionModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedClientId?: string
}

export function ManualSessionModal({ 
  isOpen, 
  onClose, 
  preselectedClientId 
}: ManualSessionModalProps) {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [creating, setCreating] = useState(false)
  
  const [formData, setFormData] = useState({
    client_id: preselectedClientId || '',
    notes: ''
  })
  const [sessionDate, setSessionDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    if (isOpen) {
      loadClients()
    }
  }, [isOpen])

  useEffect(() => {
    // Update form when preselectedClientId changes
    if (preselectedClientId) {
      setFormData(prev => ({
        ...prev,
        client_id: preselectedClientId
      }))
    }
  }, [preselectedClientId])

  const loadClients = async () => {
    try {
      setLoadingClients(true)
      const response = await ClientService.listClients()
      setClients(response.clients)
    } catch (error) {
      console.error('Failed to load clients:', error)
      toast({
        title: 'Error',
        description: 'Failed to load clients',
        variant: 'destructive'
      })
    } finally {
      setLoadingClients(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.client_id) {
      toast({
        title: 'Error',
        description: 'Please select a client',
        variant: 'destructive'
      })
      return
    }

    setCreating(true)
    try {
      const session = await ManualSessionService.createManualSession({
        client_id: formData.client_id,
        session_date: sessionDate ? format(sessionDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
        notes: formData.notes
      })
      
      toast({
        title: 'Success',
        description: 'Session created successfully'
      })
      
      // Close modal and redirect to session details page
      onClose()
      router.push(`/sessions/${session.id}`)
    } catch (error) {
      console.error('Failed to create session:', error)
      toast({
        title: 'Error',
        description: 'Failed to create session',
        variant: 'destructive'
      })
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    // Reset form
    setFormData({
      client_id: preselectedClientId || '',
      notes: ''
    })
    setSessionDate(new Date())
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Manual Session</DialogTitle>
          <DialogDescription>
            Create a session for uploading recorded audio or video files
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">
              <User className="inline-block w-4 h-4 mr-2" />
              Client *
            </Label>
            {loadingClients ? (
              <div className="flex items-center justify-center p-3 border rounded-md">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Session Date */}
          <div className="space-y-2">
            <Label htmlFor="date">
              <CalendarIcon className="inline-block w-4 h-4 mr-2" />
              Session Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !sessionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sessionDate ? format(sessionDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={sessionDate}
                  onSelect={setSessionDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this session..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !formData.client_id || loadingClients}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Create & Upload File
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}