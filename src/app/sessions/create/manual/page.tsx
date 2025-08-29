'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Upload, Calendar, User } from 'lucide-react'
import { ManualSessionService } from '@/services/manual-session-service'
import { ClientService } from '@/services/client-service'
import { LoadingState } from '@/components/ui/loading-state'
import { toast } from '@/hooks/use-toast'

function CreateManualSessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [clients, setClients] = useState<any[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [creating, setCreating] = useState(false)
  
  // Get client ID from URL query parameter
  const prefilledClientId = searchParams.get('clientId')
  
  const [formData, setFormData] = useState({
    client_id: '',
    session_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const response = await ClientService.listClients()
      setClients(response.clients)
      
      // If we have a pre-filled client ID, set it
      if (prefilledClientId) {
        setFormData(prev => ({
          ...prev,
          client_id: prefilledClientId
        }))
      }
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
        session_date: formData.session_date,
        notes: formData.notes
      })
      
      toast({
        title: 'Success',
        description: 'Session created successfully'
      })
      
      // Redirect to session details page
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

  if (loadingClients) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <LoadingState 
          message="Loading..." 
          variant="gradient"
          className="min-h-screen"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Create Manual Session
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>New Manual Session</CardTitle>
            <CardDescription>
              Create a session for uploading recorded audio or video files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="client">
                  <User className="inline-block w-4 h-4 mr-2" />
                  Client *
                </Label>
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
              </div>

              {/* Session Date */}
              <div className="space-y-2">
                <Label htmlFor="date">
                  <Calendar className="inline-block w-4 h-4 mr-2" />
                  Session Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this session..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !formData.client_id}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {creating ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Create & Upload File
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingState message="Loading..." />
    </div>
  )
}

// Main page component with Suspense boundary
export default function CreateManualSessionPage() {
  return (
    <ProtectedRoute loadingMessage="Loading session creation...">
      <Suspense fallback={<LoadingFallback />}>
        <CreateManualSessionContent />
      </Suspense>
    </ProtectedRoute>
  )
}