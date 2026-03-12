'use client'

import { useMemo } from 'react'
import { useAdminUsers } from '@/hooks/queries/use-admin-users'
import { useAccessMatrix } from '@/hooks/queries/use-admin-access'
import { useAuth } from '@/contexts/auth-context'
import { StaleSessionProcessor } from '@/components/admin/stale-session-processor'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
  CheckCircle2,
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
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className="h-10 w-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                trend.isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
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
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
    </Card>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useAuth()

  // Check if user is the special admin account
  const isSpecialAdmin = user?.email === 'ai@novus.global'

  // React Query hooks - automatic caching and deduplication!
  const { data: users = [], isLoading: usersLoading } = useAdminUsers({
    limit: 1000,
  })
  const { data: accessMatrix = [], isLoading: accessLoading } = useAccessMatrix(
    { limit: 100 },
  )

  const loading = usersLoading || accessLoading

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

  // System health - this could be fetched from a health check endpoint
  const systemHealth = {
    api: 'operational',
    database: 'operational',
    auth: 'operational',
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Welcome back, let&apos;s see how things are going
            </p>
          </div>
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Welcome back, let&apos;s see how things are going
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          description={`${stats.activeUsers} active users`}
          icon={<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          onClick={() => router.push('/admin/users')}
        />
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          description={`${stats.assignedClients} assigned`}
          icon={
            <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
          }
          onClick={() => router.push('/admin/access')}
        />
        <StatCard
          title="Active Coaches"
          value={stats.roleDistribution.coach}
          description="Coaching users"
          icon={
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          }
          onClick={() => router.push('/admin/roles')}
        />
        <StatCard
          title="Administrators"
          value={
            stats.roleDistribution.admin + stats.roleDistribution.super_admin
          }
          description="System admins"
          icon={
            <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          }
          onClick={() => router.push('/admin/roles')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Role Distribution</span>
              <BarChart3 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
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
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {role.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {count}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Total Users with Roles
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {totalRoleUsers}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>System Health</span>
              <Activity className="h-5 w-5 text-gray-400 dark:text-gray-500" />
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
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
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
                    <span className="font-medium capitalize text-gray-700 dark:text-gray-300">
                      {service} Service
                    </span>
                  </div>
                  <Badge
                    variant={
                      status === 'operational' ? 'default' : 'destructive'
                    }
                    className={`${
                      status === 'operational'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30'
                        : status === 'degraded'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/30'
                          : status === 'down'
                            ? 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/30'
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last checked: Just now
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => router.push('/admin/users')}
            >
              <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div className="text-center">
                <p className="font-medium text-sm">Manage Users</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Add or edit users
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => router.push('/admin/access')}
            >
              <LockKeyhole className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div className="text-center">
                <p className="font-medium text-sm">Access Control</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Manage permissions
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => router.push('/admin/roles')}
            >
              <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div className="text-center">
                <p className="font-medium text-sm">Role Management</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Assign roles
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stale Session Processor - Only visible to ai@novus.global */}
      {isSpecialAdmin && (
        <div className="mt-6">
          <StaleSessionProcessor />
        </div>
      )}
    </div>
  )
}
