'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  DashboardSummary,
  Task,
  TimelineItem,
  clientDashboardAPI,
} from '@/services/client-dashboard-api'
import { TaskList } from './components/task-list'
import { GoalsWidget } from './components/goals-widget'
import { Timeline } from './components/timeline'
import { TaskDetailModal } from './components/task-detail-modal'
import {
  Calendar,
  TrendingUp,
  FileText,
  ArrowRight,
  User,
  Target,
  Bell,
  ListTodo,
} from 'lucide-react'
import { format } from 'date-fns'

export default function EnhancedClientDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(
    null,
  )
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    checkAuth()
    fetchDashboardData()
    fetchTimeline()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
    }
  }

  const fetchDashboardData = async () => {
    try {
      const data = await clientDashboardAPI.getDashboard()
      setDashboardData(data)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      if (err.message.includes('authentication')) {
      } else {
        setError(err.message || 'Failed to load dashboard')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTimeline = async () => {
    try {
      const items = await clientDashboardAPI.getTimeline()
      setTimelineItems(items)
    } catch (err) {
      console.error('Failed to fetch timeline:', err)
    }
  }

  const handleTaskStatusUpdate = async (
    taskId: string,
    status: Task['status'],
  ) => {
    try {
      const updatedTask = await clientDashboardAPI.updateTaskStatus(
        taskId,
        status,
      )

      // Update local state
      if (dashboardData) {
        const updatedTasks = dashboardData.upcoming_tasks.map(task =>
          task.id === taskId ? updatedTask : task,
        )
        setDashboardData({
          ...dashboardData,
          upcoming_tasks: updatedTasks,
          stats: {
            ...dashboardData.stats,
            completed_tasks:
              status === 'completed'
                ? dashboardData.stats.completed_tasks + 1
                : dashboardData.stats.completed_tasks,
            pending_tasks:
              status === 'completed'
                ? dashboardData.stats.pending_tasks - 1
                : dashboardData.stats.pending_tasks,
          },
        })
      }

      // Refresh timeline if task completed
      if (status === 'completed') {
        fetchTimeline()
      }
    } catch (err) {
      console.error('Failed to update task status:', err)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    if (dashboardData) {
      const updatedTasks = dashboardData.upcoming_tasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task,
      )
      setDashboardData({
        ...dashboardData,
        upcoming_tasks: updatedTasks,
      })
    }
    setSelectedTask(updatedTask)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), 'MMMM yyyy')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error: {error}</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p>No data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {dashboardData.client_info.name}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your coaching journey and progress
        </p>
      </div>

      {/* Coach Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-900">
                  Your coach:{' '}
                  <span className="font-semibold">
                    Coach {dashboardData.client_info.coach_id.slice(0, 8)}
                  </span>
                </p>
                <p className="text-xs text-blue-700">
                  Member since{' '}
                  {formatDate(dashboardData.client_info.member_since)}
                </p>
              </div>
            </div>
            {dashboardData.stats.unread_notifications > 0 && (
              <Badge className="bg-red-100 text-red-800">
                <Bell className="h-3 w-3 mr-1" />
                {dashboardData.stats.unread_notifications} new
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.stats.total_sessions}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.stats.pending_tasks}
            </div>
            <p className="text-xs text-green-600">
              {dashboardData.stats.completed_tasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.stats.active_goals}
            </div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.stats.current_streak_days}
            </div>
            <p className="text-xs text-muted-foreground">Days active</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Sessions</CardTitle>
                <Link href="/client-portal/sessions">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {dashboardData.recent_sessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No sessions yet. Your sessions will appear here after your
                  first coaching call.
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recent_sessions.slice(0, 3).map(session => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {format(
                              new Date(session.session_date),
                              'MMMM d, yyyy',
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.duration_minutes} minutes •{' '}
                            {session.tasks_assigned} tasks
                          </p>
                        </div>
                      </div>
                      <Link href={`/client-portal/sessions/${session.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tasks Preview */}
          {dashboardData.upcoming_tasks.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('tasks')}
                  >
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TaskList
                  tasks={dashboardData.upcoming_tasks.slice(0, 3)}
                  onStatusUpdate={handleTaskStatusUpdate}
                  onTaskClick={handleTaskClick}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Your Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList
                tasks={dashboardData.upcoming_tasks}
                onStatusUpdate={handleTaskStatusUpdate}
                onTaskClick={handleTaskClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Timeline items={timelineItems} />
        </TabsContent>

        <TabsContent value="goals">
          <GoalsWidget goals={dashboardData.active_goals} />
        </TabsContent>
      </Tabs>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setSelectedTask(null)
        }}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  )
}
