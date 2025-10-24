'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CommitmentService } from '@/services/commitment-service'
import { Commitment, CommitmentCreate } from '@/types/commitment'
import { CommitmentProgressModal } from '@/components/commitments/commitment-progress-modal'
import { CommitmentForm } from '@/components/commitments/commitment-form'
import { CommitmentQuickComplete } from '@/components/commitments/commitment-quick-complete'
import {
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Edit,
  MoreVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function MyCommitmentsPage() {
  const [loading, setLoading] = useState(true)
  const [activeCommitments, setActiveCommitments] = useState<Commitment[]>([])
  const [completedCommitments, setCompletedCommitments] = useState<
    Commitment[]
  >([])
  const [selectedCommitment, setSelectedCommitment] =
    useState<Commitment | null>(null)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    loadCommitments()
  }, [])

  const loadCommitments = async () => {
    setLoading(true)
    try {
      const response = await CommitmentService.listCommitments({
        include_drafts: false,
      })

      const commitments = response.commitments || []
      setActiveCommitments(commitments.filter(c => c.status === 'active'))
      setCompletedCommitments(commitments.filter(c => c.status === 'completed'))
    } catch (error) {
      console.error('Failed to load commitments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProgress = async (data: any) => {
    if (!selectedCommitment) return

    try {
      await CommitmentService.updateProgress(selectedCommitment.id, data)
      toast.success('Progress updated successfully')
      await loadCommitments()
      setProgressModalOpen(false)
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const handleUpdateCommitment = async (data: CommitmentCreate) => {
    if (!selectedCommitment) return

    try {
      await CommitmentService.updateCommitment(selectedCommitment.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        target_date: data.target_date,
        measurement_criteria: data.measurement_criteria,
      })
      toast.success('Commitment updated successfully')
      await loadCommitments()
      setEditModalOpen(false)
    } catch (error) {
      console.error('Failed to update commitment:', error)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'action':
        return 'bg-blue-100 text-blue-800'
      case 'habit':
        return 'bg-purple-100 text-purple-800'
      case 'milestone':
        return 'bg-green-100 text-green-800'
      case 'learning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  const totalCommitments =
    activeCommitments.length + completedCommitments.length
  const completionRate =
    totalCommitments > 0
      ? Math.round((completedCommitments.length / totalCommitments) * 100)
      : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Commitments</h1>
        <p className="text-gray-600 mt-2">
          Track your commitments from coaching sessions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-gray-50">
          <TabsTrigger value="active">
            Active ({activeCommitments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedCommitments.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Commitments */}
        <TabsContent value="active" className="space-y-4">
          {activeCommitments.length === 0 ? (
            <Card className="border-gray-200">
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No active commitments</p>
                <p className="text-sm text-gray-500 mt-2">
                  Your commitments will appear here after coaching sessions
                </p>
              </CardContent>
            </Card>
          ) : (
            activeCommitments.map(commitment => (
              <Card
                key={commitment.id}
                className="border-gray-200 hover:shadow-sm transition-shadow group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Quick Complete Checkbox */}
                    <div className="pt-0.5">
                      <CommitmentQuickComplete
                        commitment={commitment}
                        onComplete={loadCommitments}
                        size="lg"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                            {commitment.title}
                          </h3>
                          {commitment.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {commitment.description}
                            </p>
                          )}

                          {/* Compact Metadata */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge
                              className={getTypeColor(commitment.type)}
                              variant="secondary"
                            >
                              {commitment.type}
                            </Badge>
                            {commitment.priority !== 'medium' && (
                              <Badge
                                variant="outline"
                                className={getPriorityColor(
                                  commitment.priority,
                                )}
                              >
                                {commitment.priority}
                              </Badge>
                            )}
                            {commitment.target_date && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {format(
                                    new Date(commitment.target_date),
                                    'MMM d',
                                  )}
                                </span>
                              </div>
                            )}
                            {commitment.progress_percentage > 0 &&
                              commitment.progress_percentage < 100 && (
                                <span className="text-gray-600">
                                  {commitment.progress_percentage}%
                                </span>
                              )}
                          </div>
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCommitment(commitment)
                                setEditModalOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCommitment(commitment)
                                setProgressModalOpen(true)
                              }}
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Update Progress
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Completed Commitments */}
        <TabsContent value="completed" className="space-y-3">
          {completedCommitments.length === 0 ? (
            <Card className="border-gray-200">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No completed commitments yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Completed commitments will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            completedCommitments.map(commitment => (
              <Card
                key={commitment.id}
                className="border-gray-200 hover:shadow-sm transition-shadow group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Completed Checkbox */}
                    <div className="pt-0.5">
                      <CommitmentQuickComplete
                        commitment={commitment}
                        onComplete={loadCommitments}
                        size="lg"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                            {commitment.title}
                          </h3>
                          {commitment.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {commitment.description}
                            </p>
                          )}

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                            <Badge
                              className={getTypeColor(commitment.type)}
                              variant="secondary"
                            >
                              {commitment.type}
                            </Badge>
                            {commitment.completed_date && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {format(
                                    new Date(commitment.completed_date),
                                    'MMM d, yyyy',
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* View Details Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCommitment(commitment)
                                setEditModalOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedCommitment && (
        <>
          <CommitmentProgressModal
            commitment={selectedCommitment}
            open={progressModalOpen}
            onOpenChange={setProgressModalOpen}
            onSubmit={handleUpdateProgress}
          />

          <CommitmentForm
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            commitment={selectedCommitment}
            onSubmit={handleUpdateCommitment}
            clientId={selectedCommitment.client_id}
            sessionId={selectedCommitment.session_id}
          />
        </>
      )}
    </div>
  )
}
