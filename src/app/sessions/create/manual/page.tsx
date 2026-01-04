'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Upload } from 'lucide-react'
import { ManualSessionService } from '@/services/manual-session-service'
import { useClientsSimple } from '@/hooks/queries/use-clients'
import { LoadingState } from '@/components/ui/loading-state'
import { toast } from '@/hooks/use-toast'

function CreateManualSessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use lightweight clients query for fast loading
  const { data: clientsData, isLoading: loadingClients } = useClientsSimple()
  const clients = clientsData?.clients || []

  const [creating, setCreating] = useState(false)

  // Get client ID from URL query parameter
  const prefilledClientId = searchParams.get('clientId')

  const [formData, setFormData] = useState({
    client_id: '',
    session_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    // If we have a pre-filled client ID, set it
    if (prefilledClientId) {
      setFormData(prev => ({
        ...prev,
        client_id: prefilledClientId,
      }))
    }
  }, [prefilledClientId])

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
        session_date: formData.session_date,
        notes: formData.notes,
      })

      toast({
        title: 'Success',
        description: 'Session created successfully',
      })

      // Redirect to session details page
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

  if (loadingClients) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingState message="Loading clients..." className="min-h-screen" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              Add Past Session
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg">Session Details</CardTitle>
            <CardDescription className="text-gray-600">
              Create a session to upload and analyze recorded audio or video
              files
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label
                  htmlFor="client"
                  className="text-base font-medium text-gray-900"
                >
                  Client <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.client_id}
                  onValueChange={value =>
                    setFormData({ ...formData, client_id: value })
                  }
                >
                  <SelectTrigger id="client" className="border-gray-200">
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
              </div>

              {/* Session Date */}
              <div className="space-y-2">
                <Label
                  htmlFor="date"
                  className="text-base font-medium text-gray-900"
                >
                  Session Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.session_date}
                  onChange={e =>
                    setFormData({ ...formData, session_date: e.target.value })
                  }
                  className="border-gray-200"
                />
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
                  rows={4}
                  className="border-gray-200"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={creating}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !formData.client_id}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {creating ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Create Session
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
