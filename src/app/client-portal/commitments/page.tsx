'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommitmentProgressModal } from '@/components/commitments/commitment-progress-modal'
import { MilestoneList } from '@/components/commitments/milestone-list'
import { Commitment, CommitmentUpdateCreate } from '@/types/commitment'
import { CommitmentService } from '@/services/commitment-service'
import {
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Calendar,
  PartyPopper,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, isPast, parseISO, format } from 'date-fns'

export default function ClientCommitmentsPage() {
  const [loading, setLoading] = useState(true)
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [selectedCommitment, setSelectedCommitment] =
    useState<Commitment | null>(null)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
    loadCommitments()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
    }
  }

  const loadCommitments = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await CommitmentService.listCommitments({
        include_drafts: false,
      })
      setCommitments(response.commitments || [])
    } catch (err) {
      console.error('Failed to load commitments:', err)
      setError('Failed to load commitments')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProgress = async (data: CommitmentUpdateCreate) => {
    if (!selectedCommitment) return

    try {
      await CommitmentService.updateProgress(selectedCommitment.id, data)
      await loadCommitments()

      // Show celebration if completed
      if (data.progress_percentage === 100) {
        // You could add a toast notification here
        alert('Congratulations on completing your commitment!')
      }
    } catch (err) {
      console.error('Failed to update progress:', err)
      alert('Failed to update progress')
      throw err
    }
  }

  const openProgressModal = (commitment: Commitment) => {
    setSelectedCommitment(commitment)
    setProgressModalOpen(true)
  }

  const getDeadlineInfo = (commitment: Commitment) => {
    if (!commitment.target_date) return null

    const targetDate = parseISO(commitment.target_date)
    const isOverdue = isPast(targetDate) && commitment.status !== 'completed'

    if (isOverdue) {
      return {
        text: `Overdue by ${Math.abs(Math.floor((new Date().getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)))} days`,
        className: 'text-red-600',
        icon: AlertCircle,
      }
    } else {
      return {
        text: formatDistanceToNow(targetDate, { addSuffix: true }),
        className: 'text-gray-600',
        icon: Clock,
      }
    }
  }

  // Filter commitments
  const activeCommitments = commitments.filter(c => c.status === 'active')
  const completedCommitments = commitments.filter(c => c.status === 'completed')

  // Calculate stats
  const totalActive = activeCommitments.length
  const totalCompleted = completedCommitments.length
  const avgProgress =
    totalActive > 0
      ? Math.round(
          activeCommitments.reduce((sum, c) => sum + c.progress_percentage, 0) /
            totalActive,
        )
      : 0

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="size-8 animate-spin text-gray-500" />
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
          <Button
            onClick={loadCommitments}
            variant="outline"
            className="border-gray-300"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Commitments</h1>
        <p className="text-gray-600 mt-2">
          Track your progress and update your commitments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Active Commitments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="size-5 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">
                {totalActive}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">
                {totalCompleted}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Average Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">
                {avgProgress}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={v => setActiveTab(v as typeof activeTab)}
      >
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-gray-50"
          >
            Active ({totalActive})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-gray-50"
          >
            Completed ({totalCompleted})
          </TabsTrigger>
        </TabsList>

        {/* Active Commitments */}
        <TabsContent value="active" className="mt-6 space-y-4">
          {activeCommitments.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="py-12 text-center">
                <Target className="size-12 mx-auto mb-3 text-zinc-700" />
                <p className="text-gray-600">No active commitments</p>
                <p className="text-sm text-gray-600 mt-1">
                  Your coach will help you create commitments during sessions
                </p>
              </CardContent>
            </Card>
          ) : (
            activeCommitments.map(commitment => {
              const deadlineInfo = getDeadlineInfo(commitment)
              return (
                <Card key={commitment.id} className="bg-white border-gray-200">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                          >
                            {commitment.type}
                          </Badge>
                          {commitment.priority !== 'medium' && (
                            <Badge
                              variant="outline"
                              className={cn(
                                commitment.priority === 'urgent' &&
                                  'bg-red-500/10 text-red-400 border-red-500/20',
                                commitment.priority === 'high' &&
                                  'bg-orange-500/10 text-orange-400 border-orange-500/20',
                                commitment.priority === 'low' &&
                                  'bg-gray-500/10 text-gray-400 border-gray-500/20',
                              )}
                            >
                              {commitment.priority}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-gray-900">
                          {commitment.title}
                        </CardTitle>
                        {commitment.description && (
                          <p className="text-sm text-gray-600">
                            {commitment.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-900 font-medium">
                          {commitment.progress_percentage}%
                        </span>
                      </div>
                      <Progress
                        value={commitment.progress_percentage}
                        className="h-2 bg-gray-50"
                      />
                    </div>

                    {/* Deadline */}
                    {deadlineInfo && (
                      <div className="flex items-center gap-2 text-sm">
                        <deadlineInfo.icon
                          className={cn('size-4', deadlineInfo.className)}
                        />
                        <span className={deadlineInfo.className}>
                          {deadlineInfo.text}
                        </span>
                      </div>
                    )}

                    {/* Success Criteria */}
                    {commitment.measurement_criteria && (
                      <div className="text-sm">
                        <span className="text-gray-600">
                          Success Criteria:{' '}
                        </span>
                        <span className="text-gray-700">
                          {commitment.measurement_criteria}
                        </span>
                      </div>
                    )}

                    {/* Milestones */}
                    {commitment.milestones &&
                      commitment.milestones.length > 0 && (
                        <MilestoneList
                          milestones={commitment.milestones}
                          readOnly
                          compact
                        />
                      )}

                    {/* Update Button */}
                    <Button
                      className="w-full bg-white text-black hover:bg-zinc-200"
                      onClick={() => openProgressModal(commitment)}
                    >
                      <TrendingUp className="size-4 mr-2" />
                      Update Progress
                    </Button>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Completed Commitments */}
        <TabsContent value="completed" className="mt-6 space-y-4">
          {completedCommitments.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="size-12 mx-auto mb-3 text-zinc-700" />
                <p className="text-gray-600">No completed commitments yet</p>
                <p className="text-sm text-gray-600 mt-1">
                  Complete your active commitments to see them here
                </p>
              </CardContent>
            </Card>
          ) : (
            completedCommitments.map(commitment => (
              <Card
                key={commitment.id}
                className="bg-white border-gray-200 opacity-80"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <PartyPopper className="size-5 text-green-500" />
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-400 border-green-500/20"
                        >
                          Completed
                        </Badge>
                      </div>
                      <CardTitle className="text-gray-900">
                        {commitment.title}
                      </CardTitle>
                      {commitment.description && (
                        <p className="text-sm text-gray-600">
                          {commitment.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {commitment.completed_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="size-4" />
                      <span>
                        Completed on{' '}
                        {format(
                          parseISO(commitment.completed_date),
                          'MMM d, yyyy',
                        )}
                      </span>
                    </div>
                  )}

                  {commitment.milestones &&
                    commitment.milestones.length > 0 && (
                      <MilestoneList
                        milestones={commitment.milestones}
                        readOnly
                        compact
                      />
                    )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Progress Modal */}
      <CommitmentProgressModal
        commitment={selectedCommitment}
        open={progressModalOpen}
        onOpenChange={setProgressModalOpen}
        onSubmit={handleUpdateProgress}
      />
    </div>
  )
}
