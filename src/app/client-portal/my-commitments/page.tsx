'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  ClientCommitmentService,
  ClientCommitmentCreate,
  ClientCommitmentUpdate,
} from '@/services/client-commitment-service'
import { Commitment } from '@/types/commitment'
import { CommitmentProgressModal } from '@/components/commitments/commitment-progress-modal'
import { ClientCommitmentForm } from '@/components/client-portal/client-commitment-form'
import { ClientCommitmentBoard } from '@/components/client-portal/client-commitment-board'
import {
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  LayoutGrid,
  List,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type ViewMode = 'board' | 'list'

export default function MyCommitmentsPage() {
  const [loading, setLoading] = useState(true)
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('board')
  const [selectedCommitment, setSelectedCommitment] =
    useState<Commitment | null>(null)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commitmentToDelete, setCommitmentToDelete] =
    useState<Commitment | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCommitments()
  }, [])

  const loadCommitments = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ClientCommitmentService.listCommitments()
      setCommitments(response.commitments || [])
    } catch (err) {
      console.error('Failed to load commitments:', err)
      setError('Failed to load commitments')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCommitment = async (
    data: ClientCommitmentCreate | ClientCommitmentUpdate,
  ) => {
    try {
      await ClientCommitmentService.createCommitment(
        data as ClientCommitmentCreate,
      )
      toast.success('Commitment created!')
      await loadCommitments()
    } catch (err) {
      console.error('Failed to create commitment:', err)
      toast.error('Failed to create commitment')
      throw err
    }
  }

  const handleUpdateCommitment = async (
    data: ClientCommitmentCreate | ClientCommitmentUpdate,
  ) => {
    if (!selectedCommitment) return
    try {
      await ClientCommitmentService.updateCommitment(
        selectedCommitment.id,
        data as ClientCommitmentUpdate,
      )
      toast.success('Commitment updated!')
      await loadCommitments()
    } catch (err) {
      console.error('Failed to update commitment:', err)
      toast.error('Failed to update commitment')
      throw err
    }
  }

  const handleUpdateProgress = async (data: any) => {
    if (!selectedCommitment) return
    try {
      await ClientCommitmentService.updateProgress(selectedCommitment.id, data)
      toast.success('Progress updated!')
      await loadCommitments()
      setProgressModalOpen(false)
    } catch (err) {
      console.error('Failed to update progress:', err)
      toast.error('Failed to update progress')
    }
  }

  const handleDeleteCommitment = async () => {
    if (!commitmentToDelete) return
    try {
      await ClientCommitmentService.deleteCommitment(commitmentToDelete.id)
      toast.success('Commitment deleted')
      setDeleteDialogOpen(false)
      setCommitmentToDelete(null)
      await loadCommitments()
    } catch (err) {
      console.error('Failed to delete commitment:', err)
      toast.error('Failed to delete commitment')
    }
  }

  const openProgressModal = (commitment: Commitment) => {
    setSelectedCommitment(commitment)
    setProgressModalOpen(true)
  }

  const openEditModal = (commitment: Commitment) => {
    setSelectedCommitment(commitment)
    setFormModalOpen(true)
  }

  const openCreateModal = () => {
    setSelectedCommitment(null)
    setFormModalOpen(true)
  }

  const confirmDelete = (commitment: Commitment) => {
    setCommitmentToDelete(commitment)
    setDeleteDialogOpen(true)
  }

  // Stats
  const activeCommitments = commitments.filter(c => c.status === 'active')
  const completedCommitments = commitments.filter(c => c.status === 'completed')
  const totalCommitments = commitments.length
  const completionRate =
    totalCommitments > 0
      ? Math.round((completedCommitments.length / totalCommitments) * 100)
      : 0

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertCircle className="size-12 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadCommitments} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Commitments</h1>
          <p className="text-gray-600 mt-2">
            Track and manage your personal commitments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCommitments}
            className="border-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Commitment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {activeCommitments.length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {completedCommitments.length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {completionRate}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {totalCommitments}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">All Commitments</h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'board' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('board')}
            className={viewMode === 'board' ? '' : 'hover:bg-white'}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Board
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? '' : 'hover:bg-white'}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>
      </div>

      {/* Content */}
      {commitments.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Commitments Yet
            </h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Create your first commitment to start tracking your goals and
              progress
            </p>
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Commitment
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'board' ? (
        <ClientCommitmentBoard
          commitments={commitments}
          onCommitmentClick={openProgressModal}
          onEdit={openEditModal}
          onDelete={confirmDelete}
          onStatusChange={loadCommitments}
        />
      ) : (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="bg-gray-50">
            <TabsTrigger value="active">
              Active ({activeCommitments.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedCommitments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {activeCommitments.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No active commitments</p>
                </CardContent>
              </Card>
            ) : (
              activeCommitments.map(commitment => (
                <Card
                  key={commitment.id}
                  className="border-gray-200 hover:shadow-sm transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{commitment.type}</Badge>
                          {commitment.priority !== 'medium' && (
                            <Badge variant="outline">
                              {commitment.priority}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {commitment.title}
                        </h3>
                        {commitment.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {commitment.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(commitment)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openProgressModal(commitment)}
                        >
                          Update Progress
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {completedCommitments.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No completed commitments yet</p>
                </CardContent>
              </Card>
            ) : (
              completedCommitments.map(commitment => (
                <Card
                  key={commitment.id}
                  className="border-gray-200 opacity-80"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {commitment.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                          <Badge variant="secondary">{commitment.type}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Modals */}
      <ClientCommitmentForm
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        commitment={selectedCommitment}
        onSubmit={
          selectedCommitment ? handleUpdateCommitment : handleCreateCommitment
        }
      />

      {selectedCommitment && (
        <CommitmentProgressModal
          commitment={selectedCommitment}
          open={progressModalOpen}
          onOpenChange={setProgressModalOpen}
          onSubmit={handleUpdateProgress}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commitment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{commitmentToDelete?.title}
              &rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCommitment}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
