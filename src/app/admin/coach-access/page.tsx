'use client'

import { useState, useMemo } from 'react'
import { useAdminUsers } from '@/hooks/queries/use-admin-users'
import { useCoachAccessList } from '@/hooks/queries/use-admin-coach-access'
import {
  useAssignCoachToAdmin,
  useRemoveCoachFromAdmin,
} from '@/hooks/mutations/use-admin-coach-access-mutations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UserCheck,
  Link2,
  Unlink,
  Search,
  Plus,
  Shield,
  Briefcase,
} from 'lucide-react'
import { User } from '@/services/admin-service'
import { usePermissions } from '@/contexts/permission-context'

export default function CoachAccessPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'coaches' | 'admins'>('coaches')
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedCoach, setSelectedCoach] = useState<User | null>(null)
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null)

  const permissions = usePermissions()

  // React Query hooks - automatic caching!
  const { data: users = [], isLoading: usersLoading } = useAdminUsers({
    limit: 1000,
  })
  const { data: coachAccessList = [], isLoading: accessLoading } =
    useCoachAccessList()

  const loading = usersLoading || accessLoading

  // Mutation hooks
  const { mutate: assignCoach } = useAssignCoachToAdmin()
  const { mutate: removeCoach } = useRemoveCoachFromAdmin()

  // Separate users by role with memoization
  const { coaches, admins } = useMemo(() => {
    const coaches = users.filter(u => u.roles.includes('coach'))
    const admins = users.filter(
      u => u.roles.includes('admin') || u.roles.includes('super_admin'),
    )
    return { coaches, admins }
  }, [users])

  // Build coach assignments with memoization
  const coachAssignments = useMemo(() => {
    return coaches.map(coach => {
      const assignments = coachAccessList.filter(
        ca => ca.coach_user_id === coach.id,
      )
      const assignedAdminIds = assignments.map(a => a.admin_user_id)
      const assignedAdmins = admins.filter(admin =>
        assignedAdminIds.includes(admin.id),
      )

      return {
        coach,
        assignedAdmins,
        clientCount: coach.client_count || 0,
      }
    })
  }, [coaches, admins, coachAccessList])

  // Build admin assignments with memoization
  const adminAssignments = useMemo(() => {
    return admins.map(admin => {
      const assignments = coachAccessList.filter(
        ca => ca.admin_user_id === admin.id,
      )
      const assignedCoachIds = assignments.map(a => a.coach_user_id)
      const assignedCoaches = coaches.filter(coach =>
        assignedCoachIds.includes(coach.id),
      )

      // Calculate total clients from assigned coaches
      const totalClients = assignedCoaches.reduce(
        (sum, coach) => sum + (coach.client_count || 0),
        0,
      )

      return {
        admin,
        assignedCoaches,
        totalClients,
      }
    })
  }, [admins, coaches, coachAccessList])

  const handleAssignCoachToAdmin = () => {
    if (!selectedCoach || !selectedAdmin) return

    assignCoach(
      {
        coachUserId: selectedCoach.id,
        adminUserId: selectedAdmin.id,
      },
      {
        onSuccess: () => {
          setIsAssignDialogOpen(false)
          setSelectedCoach(null)
          setSelectedAdmin(null)
        },
      },
    )
  }

  const handleUnassign = (coachId: string, adminId: string) => {
    removeCoach({
      coachUserId: coachId,
      adminUserId: adminId,
    })
  }

  const filteredCoaches = coachAssignments.filter(
    ca =>
      ca.coach.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ca.coach.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredAdmins = adminAssignments.filter(
    aa =>
      aa.admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aa.admin.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getUserInitials = (email: string, fullName?: string | null) => {
    if (fullName) {
      return fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Coach Access Management
          </h1>
          <p className="text-gray-500 mt-2">
            Manage admin access to coaches and their clients
          </p>
        </div>
        {permissions.isSuperAdmin() && (
          <Button onClick={() => setIsAssignDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Assign Coach
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Coaches
              </CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coachAssignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Admins
              </CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminAssignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Assigned
              </CardTitle>
              <Link2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                coachAssignments.filter(ca => ca.assignedAdmins.length > 0)
                  .length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Unassigned
              </CardTitle>
              <Unlink className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                coachAssignments.filter(ca => ca.assignedAdmins.length === 0)
                  .length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle and Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'coaches' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('coaches')}
                  className="rounded-md"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  By Coach
                </Button>
                <Button
                  variant={viewMode === 'admins' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('admins')}
                  className="rounded-md"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  By Admin
                </Button>
              </div>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-full mb-4" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === 'coaches' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoaches.map(assignment => (
            <Card
              key={assignment.coach.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignment.coach.email}`}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200">
                        {getUserInitials(
                          assignment.coach.email,
                          assignment.coach.full_name,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {assignment.coach.full_name || assignment.coach.email}
                      </h3>
                      {assignment.coach.full_name && (
                        <p className="text-sm text-gray-500">
                          {assignment.coach.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Clients</span>
                    <Badge variant="secondary">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {assignment.clientCount}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Assigned Admins
                      </span>
                      {assignment.assignedAdmins.length === 0 && (
                        <Badge variant="outline" className="text-xs">
                          Unassigned
                        </Badge>
                      )}
                    </div>
                    {assignment.assignedAdmins.length > 0 ? (
                      <div className="space-y-2">
                        {assignment.assignedAdmins.map(admin => (
                          <div
                            key={admin.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-purple-100">
                                  {getUserInitials(
                                    admin.email,
                                    admin.full_name,
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {admin.full_name || admin.email}
                              </span>
                            </div>
                            {permissions.isSuperAdmin() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleUnassign(assignment.coach.id, admin.id)
                                }
                              >
                                <Unlink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        No admins assigned
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAdmins.map(assignment => (
            <Card
              key={assignment.admin.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignment.admin.email}`}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-100 to-purple-200">
                        {getUserInitials(
                          assignment.admin.email,
                          assignment.admin.full_name,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {assignment.admin.full_name || assignment.admin.email}
                      </h3>
                      {assignment.admin.full_name && (
                        <p className="text-sm text-gray-500">
                          {assignment.admin.email}
                        </p>
                      )}
                      <div className="flex gap-1 mt-1">
                        {assignment.admin.roles.map(role => (
                          <Badge
                            key={role}
                            variant={
                              role === 'super_admin' ? 'destructive' : 'default'
                            }
                            className="text-xs"
                          >
                            {role.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total Clients</span>
                    <Badge variant="secondary">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {assignment.totalClients}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Assigned Coaches
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {assignment.assignedCoaches.length} coaches
                      </Badge>
                    </div>
                    {assignment.assignedCoaches.length > 0 ? (
                      <div className="space-y-2">
                        {assignment.assignedCoaches.map(coach => (
                          <div
                            key={coach.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-blue-100">
                                  {getUserInitials(
                                    coach.email,
                                    coach.full_name,
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {coach.full_name || coach.email}
                              </span>
                            </div>
                            {permissions.isSuperAdmin() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleUnassign(coach.id, assignment.admin.id)
                                }
                              >
                                <Unlink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        No coaches assigned
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Coach to Admin</DialogTitle>
            <DialogDescription>
              Grant an admin access to a coach and all their clients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Select Coach
              </label>
              <Select
                value={selectedCoach?.id}
                onValueChange={value => {
                  const coach = coaches.find(c => c.id === value)
                  setSelectedCoach(coach || null)
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a coach..." />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map(coach => (
                    <SelectItem key={coach.id} value={coach.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(coach.email, coach.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{coach.full_name || coach.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Select Admin
              </label>
              <Select
                value={selectedAdmin?.id}
                onValueChange={value => {
                  const admin = admins.find(a => a.id === value)
                  setSelectedAdmin(admin || null)
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an admin..." />
                </SelectTrigger>
                <SelectContent>
                  {admins.map(admin => (
                    <SelectItem key={admin.id} value={admin.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(admin.email, admin.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{admin.full_name || admin.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignCoachToAdmin}
              disabled={!selectedCoach || !selectedAdmin}
            >
              Assign Coach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
