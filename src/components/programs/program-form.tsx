'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import {
  useCreateProgram,
  useUpdateProgram,
  useProgramDashboard,
  useAddClientsToProgram,
  useRemoveClientFromProgram,
} from '@/hooks/queries/use-programs'
import { useClientsSimple } from '@/hooks/queries/use-clients'
import { Program, ProgramCreate, ProgramUpdate } from '@/types/program'
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
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface ProgramFormProps {
  program?: Program
  mode: 'create' | 'edit'
}

// Program-color picker — user choice that persists to the database.
// Values retargeted to DS token literals so the visual stays in the system.
const DEFAULT_COLORS = [
  { name: 'Blue', value: '#2563EB' }, // ds-accent
  { name: 'Green', value: '#15803D' }, // forest
  { name: 'Indigo', value: '#4338CA' }, // indigo
  { name: 'Red', value: '#B91C1C' }, // vermillion
  { name: 'Amber', value: '#B45309' }, // amber-token
  { name: 'Ink', value: '#0A0A0A' }, // ink
  { name: 'Slate', value: '#404040' }, // ink-2
  { name: 'Stone', value: '#737373' }, // ink-3
]

export function ProgramForm({ program, mode }: ProgramFormProps) {
  const router = useRouter()
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [initialClients, setInitialClients] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProgramCreate>({
    defaultValues: {
      name: program?.name || '',
      description: program?.description || '',
      color: program?.color || '#2563EB',
      metadata: program?.metadata || {},
      client_ids: [],
    },
  })

  const { data: clientsData } = useClientsSimple()
  const clients = clientsData?.clients ?? []

  // Fetch program dashboard to get current clients in edit mode
  const { data: programDashboard } = useProgramDashboard(
    mode === 'edit' && program?.id ? program.id : undefined,
  )

  // Initialize selected clients when dashboard data loads
  useEffect(() => {
    if (mode === 'edit' && programDashboard?.clients) {
      const clientIds = programDashboard.clients.map(c => c.client_id)
      setSelectedClients(clientIds)
      setInitialClients(clientIds)
    }
  }, [mode, programDashboard])

  const createProgramMutation = useCreateProgram({
    onSuccess: () => {
      router.push('/admin/programs')
    },
  })

  const updateProgramMutation = useUpdateProgram({
    onSuccess: () => {
      // Don't navigate yet if we need to update memberships
      if (mode === 'edit') {
        toast.success('Sandbox details updated')
      } else {
        router.push('/admin/programs')
      }
    },
  })

  const addClientsMutation = useAddClientsToProgram()
  const removeClientMutation = useRemoveClientFromProgram()

  const selectedColor = watch('color')

  const onSubmit = async (data: ProgramCreate) => {
    if (mode === 'create') {
      createProgramMutation.mutate({
        ...data,
        client_ids: selectedClients,
      })
    } else if (program) {
      // Update program details
      updateProgramMutation.mutate({
        programId: program.id,
        data: data as ProgramUpdate,
      })

      // Handle client membership changes
      const clientsToAdd = selectedClients.filter(
        id => !initialClients.includes(id),
      )
      const clientsToRemove = initialClients.filter(
        id => !selectedClients.includes(id),
      )

      // Add new clients
      if (clientsToAdd.length > 0) {
        addClientsMutation.mutate({
          programId: program.id,
          clientIds: clientsToAdd,
        })
      }

      // Remove clients
      for (const clientId of clientsToRemove) {
        removeClientMutation.mutate({
          programId: program.id,
          clientId,
        })
      }

      // Navigate after all mutations complete
      if (clientsToAdd.length === 0 && clientsToRemove.length === 0) {
        router.push('/admin/programs')
      } else {
        // Wait a bit for mutations to complete then navigate
        setTimeout(() => {
          router.push('/admin/programs')
        }, 1000)
      }
    }
  }

  const toggleClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId],
    )
  }

  const isLoading =
    createProgramMutation.isPending ||
    updateProgramMutation.isPending ||
    addClientsMutation.isPending ||
    removeClientMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sandbox Details</CardTitle>
          <CardDescription>
            Enter the basic information for this sandbox
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Program Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Sandbox Name <span className="text-vermillion">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Sandbox name is required' })}
              placeholder="e.g., Executive Leadership Cohort 2025"
            />
            {errors.name && (
              <p className="text-sm text-vermillion">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the purpose and goals of this sandbox..."
              rows={4}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Sandbox Color</Label>
            <div className="flex items-center gap-4">
              <div className="grid grid-cols-8 gap-2">
                {DEFAULT_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setValue('color', color.value)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor === color.value
                        ? 'border-line scale-110'
                        : 'border-line-strong hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full border-2 border-line-strong "
                  style={{ backgroundColor: selectedColor }}
                />
                <Input
                  type="color"
                  {...register('color')}
                  className="w-20 h-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Assign Clients' : 'Manage Clients'}
          </CardTitle>
          <CardDescription>
            {mode === 'create'
              ? 'Select clients to include in this sandbox'
              : 'Add or remove clients from this sandbox'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {clients.length === 0 ? (
            <p className="text-sm text-ink-3 ">
              No clients available. Create clients first before assigning them
              to sandboxes.
            </p>
          ) : (
            <>
              {/* Selected Clients */}
              {selectedClients.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-4 border-b">
                  {selectedClients.map(clientId => {
                    const client = clients.find(c => c.id === clientId)
                    if (!client) return null
                    const isNew =
                      mode === 'edit' && !initialClients.includes(clientId)
                    return (
                      <Badge
                        key={clientId}
                        variant="secondary"
                        className={`pl-3 pr-1 ${isNew ? 'bg-forest-bg text-forest border-forest ' : ''}`}
                      >
                        {isNew && <Plus className="h-3 w-3 mr-1" />}
                        {client.name}
                        <button
                          type="button"
                          onClick={() => toggleClient(clientId)}
                          className="ml-2 hover:bg-surface-3 rounded p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}

              {/* Removed Clients (in edit mode) */}
              {mode === 'edit' &&
                initialClients.some(id => !selectedClients.includes(id)) && (
                  <div className="flex flex-wrap gap-2 pb-4 border-b">
                    <p className="text-sm text-ink-3 w-full mb-2">
                      Clients to be removed:
                    </p>
                    {initialClients
                      .filter(clientId => !selectedClients.includes(clientId))
                      .map(clientId => {
                        const client = clients.find(c => c.id === clientId)
                        if (!client) return null
                        return (
                          <Badge
                            key={clientId}
                            variant="secondary"
                            className="pl-3 pr-1 bg-vermillion-bg text-vermillion border-vermillion "
                          >
                            <X className="h-3 w-3 mr-1" />
                            {client.name}
                            <button
                              type="button"
                              onClick={() => toggleClient(clientId)}
                              className="ml-2 hover:bg-surface-3 rounded p-1"
                              title="Undo removal"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                  </div>
                )}

              {/* Client List */}
              <div className="max-h-96 overflow-y-auto space-y-1 border rounded-lg p-2 bg-paper ">
                {clients.map(client => {
                  const isSelected = selectedClients.includes(client.id)
                  const isNew =
                    mode === 'edit' &&
                    !initialClients.includes(client.id) &&
                    isSelected
                  const isRemoved =
                    mode === 'edit' &&
                    initialClients.includes(client.id) &&
                    !isSelected

                  return (
                    <div
                      key={client.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? isNew
                            ? 'bg-forest-bg border-2 border-forest hover:bg-forest-bg '
                            : 'bg-surface-1 border-2 border-ds-accent hover:bg-ds-accent-bg '
                          : isRemoved
                            ? 'bg-vermillion-bg border-2 border-vermillion opacity-60 hover:bg-vermillion-bg '
                            : 'bg-surface-1 border-2 border-line hover:bg-paper '
                      }`}
                      onClick={() => toggleClient(client.id)}
                    >
                      {/* Custom checkbox indicator */}
                      <div
                        className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                          isSelected
                            ? 'bg-ds-accent border-ds-accent'
                            : 'bg-surface-1 border-line-strong '
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-ink-on-dark"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 text-sm font-medium cursor-pointer select-none">
                        <div className="flex items-center gap-2">
                          {client.name}
                          {isNew && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-forest-bg text-forest border-forest "
                            >
                              New
                            </Badge>
                          )}
                          {isRemoved && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-vermillion-bg text-vermillion border-vermillion "
                            >
                              Will Remove
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create Sandbox'
              : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
