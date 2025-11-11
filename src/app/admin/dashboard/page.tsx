'use client'

import { useMemo } from 'react'
import { useAdminUsers } from '@/hooks/queries/use-admin-users'
import { useAccessMatrix } from '@/hooks/queries/use-admin-access'
import { useAuditLog } from '@/hooks/queries/use-admin-audit-log'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Shield,
  LockKeyhole,
  Activity,
  TrendingUp,
  UserCheck,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Settings,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  onClick?: () => void
}

function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  onClick,
}: StatCardProps) {
  return (
    <Card
      className="relative overflow-hidden transition-all hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">{description}</p>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </CardContent>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
    </Card>
  )
}

export default function AdminDashboard() {
  const router = useRouter()

  // React Query hooks - automatic caching and deduplication!
  const { data: users = [], isLoading: usersLoading } = useAdminUsers({
    limit: 1000,
  })
  const { data: accessMatrix = [], isLoading: accessLoading } = useAccessMatrix(
    { limit: 100 },
  )
  const { data: auditLogs = [], isLoading: auditLoading } = useAuditLog({
    limit: 50,
  })

  const loading = usersLoading || accessLoading || auditLoading

  // Calculate stats with memoization
  const stats = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.is_active).length

    // Calculate role distribution
    const roleDistribution = {
      super_admin: 0,
      admin: 0,
      coach: 0,
      viewer: 0,
    }

    users.forEach(user => {
      user.roles.forEach(role => {
        if (role in roleDistribution) {
          roleDistribution[role as keyof typeof roleDistribution]++
        }
      })
    })

    const totalClients = accessMatrix.length
    const assignedClients = accessMatrix.filter(
      c => c.assigned_users.length > 0,
    ).length

    return {
      totalUsers,
      activeUsers,
      totalClients,
      assignedClients,
      roleDistribution,
    }
  }, [users, accessMatrix])

  // Transform audit logs to activity feed
  const recentActivity = useMemo(() => {
    return auditLogs.slice(0, 20).map((log: any, index: number) => ({
      id: log.id || index,
      type: log.action || 'unknown',
      action: getActivityDescription(log.action, log.resource_type),
      user: log.user_email || 'System',
      time: formatTimeAgo(log.created_at),
      status: 'success',
      resourceType: log.resource_type,
    }))
  }, [auditLogs])

  // System health - this could be fetched from a health check endpoint
  const systemHealth = {
    api: 'operational',
    database: 'operational',
    auth: 'operational',
  }

  function getActivityDescription(action: string, resourceType: string) {
    const actionMap: Record<string, string> = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      view: 'Viewed',
      grant: 'Granted',
      revoke: 'Revoked',
    }

    const resourceMap: Record<string, string> = {
      user: 'user',
      client: 'client',
      session: 'session',
      role: 'role',
      access: 'access',
    }

    return `${actionMap[action] || action} ${resourceMap[resourceType] || resourceType}`
  }

  function formatTimeAgo(dateString: string) {
    if (!dateString) return 'Just now'

    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
    ]

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds)
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`
      }
    }

    return 'Just now'
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <UserPlus className="h-4 w-4" />
      case 'update':
        return <Activity className="h-4 w-4" />
      case 'delete':
        return <AlertCircle className="h-4 w-4" />
      case 'grant':
        return <LockKeyhole className="h-4 w-4" />
      case 'revoke':
        return <AlertCircle className="h-4 w-4" />
      case 'view':
        return <Activity className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-600 border-green-200'
      case 'warning':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200'
      case 'error':
        return 'bg-red-50 text-red-600 border-red-200'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-2">
              Welcome back, let&apos;s see how things are going
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const totalRoleUsers = Object.values(stats.roleDistribution).reduce(
    (a, b) => a + b,
    0,
  )

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-2">
            Welcome back, let&apos;s see how things are going
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          description={`${stats.activeUsers} active users`}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          onClick={() => router.push('/admin/users')}
        />
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          description={`${stats.assignedClients} assigned`}
          icon={<UserCheck className="h-5 w-5 text-green-600" />}
          onClick={() => router.push('/admin/client-access')}
        />
        <StatCard
          title="Active Coaches"
          value={stats.roleDistribution.coach}
          description="Coaching users"
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
          onClick={() => router.push('/admin/roles')}
        />
        <StatCard
          title="Administrators"
          value={
            stats.roleDistribution.admin + stats.roleDistribution.super_admin
          }
          description="System admins"
          icon={<Shield className="h-5 w-5 text-orange-600" />}
          onClick={() => router.push('/admin/roles')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Distribution Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Role Distribution</span>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </CardTitle>
            <CardDescription>User roles breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(stats.roleDistribution).map(([role, count]) => {
              const percentage =
                totalRoleUsers > 0
                  ? Math.round((count / totalRoleUsers) * 100)
                  : 0
              return (
                <div key={role} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          role === 'super_admin'
                            ? 'bg-red-500'
                            : role === 'admin'
                              ? 'bg-blue-500'
                              : role === 'coach'
                                ? 'bg-green-500'
                                : role === 'viewer'
                                  ? 'bg-gray-500'
                                  : ''
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {role.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {count}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Users with Roles</span>
                <span className="font-semibold text-gray-900">
                  {totalRoleUsers}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Activity</span>
              <Clock className="h-5 w-5 text-gray-400" />
            </CardTitle>
            <CardDescription>
              Latest system events and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-4 mt-4">
                {recentActivity.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 border ${getActivityColor(activity.status)}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <span className="text-xs text-gray-500">
                          {activity.time}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.user}
                      </p>
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="users" className="space-y-4 mt-4">
                {recentActivity
                  .filter(a =>
                    ['user', 'role', 'access'].includes(a.resourceType),
                  )
                  .map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 border ${getActivityColor(activity.status)}`}
                      >
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.action}
                          </p>
                          <span className="text-xs text-gray-500">
                            {activity.time}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.user}
                        </p>
                      </div>
                    </div>
                  ))}
              </TabsContent>
              <TabsContent value="system" className="space-y-4 mt-4">
                {recentActivity
                  .filter(a => ['session', 'client'].includes(a.resourceType))
                  .slice(0, 10).length > 0 ? (
                  recentActivity
                    .filter(a => ['session', 'client'].includes(a.resourceType))
                    .slice(0, 10)
                    .map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 border ${getActivityColor(activity.status)}`}
                        >
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.action}
                            </p>
                            <span className="text-xs text-gray-500">
                              {activity.time}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.user}
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No system events in the last 24 hours
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* System Health & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>System Health</span>
              <Activity className="h-5 w-5 text-gray-400" />
            </CardTitle>
            <CardDescription>
              Current system status and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(systemHealth).map(([service, status]) => (
                <div
                  key={service}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        status === 'operational'
                          ? 'bg-green-500 animate-pulse'
                          : status === 'degraded'
                            ? 'bg-yellow-500'
                            : status === 'down'
                              ? 'bg-red-500'
                              : ''
                      }`}
                    />
                    <span className="font-medium capitalize text-gray-700">
                      {service} Service
                    </span>
                  </div>
                  <Badge
                    variant={
                      status === 'operational' ? 'default' : 'destructive'
                    }
                    className={`${
                      status === 'operational'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : status === 'degraded'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                          : status === 'down'
                            ? 'bg-red-100 text-red-700 hover:bg-red-100'
                            : ''
                    }`}
                  >
                    {status === 'operational' && (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    {status}
                  </Badge>
                </div>
              ))}
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">Last checked: Just now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4 hover:bg-gray-50"
                onClick={() => router.push('/admin/users')}
              >
                <Users className="h-5 w-5 text-gray-600" />
                <div className="text-center">
                  <p className="font-medium text-sm">Manage Users</p>
                  <p className="text-xs text-gray-500">Add or edit users</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4 hover:bg-gray-50"
                onClick={() => router.push('/admin/access')}
              >
                <LockKeyhole className="h-5 w-5 text-gray-600" />
                <div className="text-center">
                  <p className="font-medium text-sm">Access Control</p>
                  <p className="text-xs text-gray-500">Manage permissions</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4 hover:bg-gray-50"
                onClick={() => router.push('/admin/roles')}
              >
                <Shield className="h-5 w-5 text-gray-600" />
                <div className="text-center">
                  <p className="font-medium text-sm">Role Management</p>
                  <p className="text-xs text-gray-500">Assign roles</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4 hover:bg-gray-50"
                onClick={() => (window.location.href = '/admin/settings')}
              >
                <Settings className="h-5 w-5 text-gray-600" />
                <div className="text-center">
                  <p className="font-medium text-sm">Settings</p>
                  <p className="text-xs text-gray-500">System config</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
