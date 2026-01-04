'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarIcon, Upload, Loader2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { ManualSessionService } from '@/services/manual-session-service'
import { useClientsSimple } from '@/hooks/queries/use-clients'
import { toast } from '@/hooks/use-toast'

interface ManualSessionModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedClientId?: string
}

export function ManualSessionModal({
  isOpen,
  onClose,
  preselectedClientId,
}: ManualSessionModalProps) {
  const router = useRouter()

  // Use lightweight clients query for fast loading
  const { data: clientsData, isLoading: loadingClients } = useClientsSimple()
  const clients = clientsData?.clients || []

  const [creating, setCreating] = useState(false)

  const [formData, setFormData] = useState({
    client_id: preselectedClientId || '',
    notes: '',
  })
  const [sessionDate, setSessionDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    // Update form when preselectedClientId changes
    if (preselectedClientId) {
      setFormData(prev => ({
        ...prev,
        client_id: preselectedClientId,
      }))
    }
  }, [preselectedClientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.client_id) {
      toast({
        title: 'Error',
        description: 'Please select a client',
        variant: 'destructive',
      })
      return
    }

    setCreating(true)
    try {
      const session = await ManualSessionService.createManualSession({
        client_id: formData.client_id,
        session_date: sessionDate
          ? format(sessionDate, 'yyyy-MM-dd')
          : new Date().toISOString().split('T')[0],
        notes: formData.notes,
      })

      toast({
        title: 'Success',
        description: 'Session created successfully',
      })

      // Close modal and redirect to session details page
      onClose()
      router.push(`/sessions/${session.id}`)
    } catch (error) {
      console.error('Failed to create session:', error)
      toast({
        title: 'Error',
        description: 'Failed to create session',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    // Reset form
    setFormData({
      client_id: preselectedClientId || '',
      notes: '',
    })
    setSessionDate(new Date())
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Past Session</DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a session to upload and analyze recorded audio or video files
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="client"
              className="text-base font-medium text-gray-900"
            >
              Client <span className="text-red-500">*</span>
            </Label>
            {loadingClients ? (
              <div className="flex items-center justify-center p-3 border rounded-md">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <Select
                value={formData.client_id}
                onValueChange={value =>
                  setFormData({ ...formData, client_id: value })
                }
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
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
            <Label
              htmlFor="date"
              className="text-base font-medium text-gray-900"
            >
              Session Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal border-gray-200',
                    !sessionDate && 'text-gray-400',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sessionDate ? (
                    format(sessionDate, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
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
            <Label
              htmlFor="notes"
              className="text-base font-medium text-gray-900"
            >
              Notes{' '}
              <span className="text-gray-500 font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this session..."
              value={formData.notes}
              onChange={e =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="border-gray-200"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={creating}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !formData.client_id || loadingClients}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Create Session
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
