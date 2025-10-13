'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CommitmentList } from '@/components/commitments/commitment-list'
import { CommitmentForm } from '@/components/commitments/commitment-form'
import { CommitmentProgressModal } from '@/components/commitments/commitment-progress-modal'
import {
  Commitment,
  CommitmentCreate,
  CommitmentUpdateCreate,
  CommitmentType,
} from '@/types/commitment'
import { CommitmentService } from '@/services/commitment-service'
import { ClientService } from '@/services/client-service'
import { Client } from '@/types/meeting'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Target,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react'

export default function CommitmentsPage() {
  const [loading, setLoading] = useState(true)
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<CommitmentType | 'all'>(
    'all',
  )
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>(
    'active',
  )

  // Modal states
  const [formOpen, setFormOpen] = useState(false)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [selectedCommitment, setSelectedCommitment] =
    useState<Commitment | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [commitmentsData, clientsData] = await Promise.all([
        CommitmentService.listCommitments({ include_drafts: false }),
        ClientService.listClients(),
      ])
      setCommitments(commitmentsData.commitments || [])
      setClients(clientsData.clients || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load commitments',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter commitments based on tab and filters
  const filteredCommitments = commitments.filter(c => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' && c.status === 'active') ||
      (activeTab === 'completed' && c.status === 'completed')

    const matchesClient =
      selectedClient === 'all' || c.client_id === selectedClient
    const matchesType = selectedType === 'all' || c.type === selectedType

    return matchesTab && matchesClient && matchesType
  })

  // Calculate stats
  const stats = {
    total_active: commitments.filter(c => c.status === 'active').length,
    total_completed: commitments.filter(c => c.status === 'completed').length,
    at_risk: commitments.filter(
      c =>
        c.status === 'active' &&
        c.target_date &&
        new Date(c.target_date) < new Date(),
    ).length,
    avg_progress:
      commitments.filter(c => c.status === 'active').length > 0
        ? Math.round(
            commitments
              .filter(c => c.status === 'active')
              .reduce((sum, c) => sum + c.progress_percentage, 0) /
              commitments.filter(c => c.status === 'active').length,
          )
        : 0,
  }

  const handleCreateCommitment = async (data: CommitmentCreate) => {
    try {
      await CommitmentService.createCommitment(data)
      toast({
        title: 'Success',
        description: 'Commitment created successfully',
      })
      await loadData()
    } catch (error) {
      console.error('Failed to create commitment:', error)
      toast({
        title: 'Error',
        description: 'Failed to create commitment',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleUpdateCommitment = async (data: CommitmentCreate) => {
    if (!selectedCommitment) return

    try {
      await CommitmentService.updateCommitment(selectedCommitment.id, data)
      toast({
        title: 'Success',
        description: 'Commitment updated successfully',
      })
      await loadData()
    } catch (error) {
      console.error('Failed to update commitment:', error)
      toast({
        title: 'Error',
        description: 'Failed to update commitment',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleDeleteCommitment = async (commitmentId: string) => {
    if (!confirm('Are you sure you want to delete this commitment?')) return

    try {
      await CommitmentService.discardCommitment(commitmentId)
      toast({
        title: 'Success',
        description: 'Commitment deleted successfully',
      })
      await loadData()
    } catch (error) {
      console.error('Failed to delete commitment:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete commitment',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateProgress = async (data: CommitmentUpdateCreate) => {
    if (!selectedCommitment) return

    try {
      await CommitmentService.updateProgress(selectedCommitment.id, data)
      toast({
        title: 'Success',
        description: 'Progress updated successfully',
      })
      await loadData()
    } catch (error) {
      console.error('Failed to update progress:', error)
      toast({
        title: 'Error',
        description: 'Failed to update progress',
        variant: 'destructive',
      })
      throw error
    }
  }

  const openEditForm = (commitment: Commitment) => {
    setSelectedCommitment(commitment)
    setFormOpen(true)
  }

  const openProgressModal = (commitment: Commitment) => {
    setSelectedCommitment(commitment)
    setProgressModalOpen(true)
  }

  const openCreateForm = () => {
    setSelectedCommitment(null)
    setFormOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Commitments</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage client commitments
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="size-4 mr-2" />
          New Commitment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Commitments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="size-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats.total_active}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              <span className="text-2xl font-bold">
                {stats.total_completed}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>At Risk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-red-600" />
              <span className="text-2xl font-bold">{stats.at_risk}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-purple-600" />
              <span className="text-2xl font-bold">{stats.avg_progress}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Select
                value={selectedType}
                onValueChange={value =>
                  setSelectedType(value as CommitmentType | 'all')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                  <SelectItem value="habit">Habit</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and List */}
      <Tabs
        value={activeTab}
        onValueChange={v => setActiveTab(v as typeof activeTab)}
      >
        <TabsList>
          <TabsTrigger value="active">
            Active ({stats.total_active})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({stats.total_completed})
          </TabsTrigger>
          <TabsTrigger value="all">All ({commitments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <CommitmentList
            commitments={filteredCommitments}
            onEdit={openEditForm}
            onDelete={handleDeleteCommitment}
            onUpdateProgress={openProgressModal}
            showFilters={false}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CommitmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={
          selectedCommitment ? handleUpdateCommitment : handleCreateCommitment
        }
        commitment={selectedCommitment}
      />

      <CommitmentProgressModal
        commitment={selectedCommitment}
        open={progressModalOpen}
        onOpenChange={setProgressModalOpen}
        onSubmit={handleUpdateProgress}
      />
    </div>
  )
}
