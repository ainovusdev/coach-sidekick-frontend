'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAdminUsers } from '@/hooks/queries/use-admin-users'
import { useAvailableRoles } from '@/hooks/queries/use-admin-roles'
import {
  useAddRole,
  useRemoveRole,
} from '@/hooks/mutations/use-admin-role-mutations'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Shield,
  Users,
  Search,
  Plus,
  Minus,
  UserCheck,
  Info,
} from 'lucide-react'

interface RoleInfo {
  name: string
  description: string
  color: string
  icon: React.ReactNode
}

const roleInfoMap: Record<string, RoleInfo> = {
  super_admin: {
    name: 'Super Admin',
    description:
      'Full system access with ability to manage all aspects including other admins',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <Shield className="h-5 w-5" />,
  },
  admin: {
    name: 'Admin',
    description:
      'Can manage users, roles, and client access. Cannot modify super admins',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Shield className="h-5 w-5" />,
  },
  coach: {
    name: 'Coach',
    description: 'Can access assigned clients and conduct coaching sessions',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <UserCheck className="h-5 w-5" />,
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to assigned clients and session data',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <Users className="h-5 w-5" />,
  },
}

export default function RolesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  // React Query hooks - automatic caching!
  const { data: users = [], isLoading: loading } = useAdminUsers({
    limit: 1000,
  })
  const { data: availableRolesData } = useAvailableRoles()
  const availableRoles = availableRolesData || { roles: [], descriptions: {} }

  // Mutation hooks
  const { mutate: addRole } = useAddRole()
  const { mutate: removeRole } = useRemoveRole()

  // Select first role by default
  useEffect(() => {
    if (availableRoles.roles.length > 0 && !selectedRole) {
      setSelectedRole(availableRoles.roles[0])
    }
  }, [availableRoles.roles, selectedRole])

  // Filter users by selected role with memoization
  const roleUsers = useMemo(() => {
    if (!selectedRole) return []
    return users.filter(user => user.roles.includes(selectedRole))
  }, [selectedRole, users])

  const handleAddRole = (userId: string, role: string) => {
    addRole({ userId, role })
  }

  const handleRemoveRole = (userId: string, role: string) => {
    if (
      !confirm(
        `Are you sure you want to remove the "${roleInfoMap[role]?.name}" role from this user?`,
      )
    ) {
      return
    }

    removeRole({ userId, role })
  }

  const filteredUsers = users.filter(
    user =>
      searchQuery === '' ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getRoleStats = (role: string) => {
    return users.filter(user => user.roles.includes(role)).length
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
        <p className="text-gray-500 mt-2">Manage user roles and permissions</p>
      </div>

      {/* Role Overview Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {availableRoles.roles.map(role => {
            const info = roleInfoMap[role]
            const count = getRoleStats(role)
            const isSelected = selectedRole === role

            // Skip rendering if role info is not defined
            if (!info) {
              return null
            }

            return (
              <Card
                key={role}
                className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-gray-900' : ''}`}
                onClick={() => setSelectedRole(role)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {info.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-xs ${info.color}`}
                    >
                      {info.icon}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {count}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {info.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Role Assignment Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>User Role Assignment</CardTitle>
              <CardDescription>Add or remove roles from users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Users List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">
                          {user.email}
                        </p>
                        {user.full_name && (
                          <p className="text-xs text-gray-500">
                            {user.full_name}
                          </p>
                        )}
                        <div className="flex gap-1 mt-1">
                          {user.roles.map(userRole => (
                            <Badge
                              key={userRole}
                              variant="outline"
                              className={`text-xs ${roleInfoMap[userRole]?.color || ''}`}
                            >
                              {roleInfoMap[userRole]?.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {availableRoles.roles.map(role => {
                          const hasRole = user.roles.includes(role)
                          return (
                            <Button
                              key={role}
                              size="sm"
                              variant={hasRole ? 'outline' : 'ghost'}
                              onClick={() =>
                                hasRole
                                  ? handleRemoveRole(user.id, role)
                                  : handleAddRole(user.id, role)
                              }
                              title={
                                hasRole
                                  ? `Remove ${roleInfoMap[role]?.name}`
                                  : `Add ${roleInfoMap[role]?.name}`
                              }
                            >
                              {hasRole ? (
                                <Minus className="h-3 w-3" />
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                              <span className="ml-1 hidden lg:inline">
                                {roleInfoMap[role]?.name}
                              </span>
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Role Details */}
        <div>
          {selectedRole && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${roleInfoMap[selectedRole]?.color || ''}`}
                  >
                    {roleInfoMap[selectedRole]?.icon}
                  </Badge>
                  {roleInfoMap[selectedRole]?.name}
                </CardTitle>
                <CardDescription>Role details and members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Description */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-600">
                        {roleInfoMap[selectedRole]?.description}
                      </p>
                    </div>
                  </div>

                  {/* Members */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Members ({roleUsers.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {roleUsers.length > 0 ? (
                        roleUsers.map(user => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-2 rounded border"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user.email}
                              </p>
                              {user.full_name && (
                                <p className="text-xs text-gray-500">
                                  {user.full_name}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleRemoveRole(user.id, selectedRole)
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-4">
                          No users with this role
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Permissions (could be expanded) */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Permissions
                    </h3>
                    <div className="space-y-1">
                      {selectedRole === 'super_admin' && (
                        <>
                          <PermissionItem label="Full system access" />
                          <PermissionItem label="Manage all users and roles" />
                          <PermissionItem label="Access all client data" />
                          <PermissionItem label="System configuration" />
                        </>
                      )}
                      {selectedRole === 'admin' && (
                        <>
                          <PermissionItem label="Manage users" />
                          <PermissionItem label="Assign roles (except super admin)" />
                          <PermissionItem label="Manage client access" />
                          <PermissionItem label="View audit logs" />
                        </>
                      )}
                      {selectedRole === 'coach' && (
                        <>
                          <PermissionItem label="Access assigned clients" />
                          <PermissionItem label="Create coaching sessions" />
                          <PermissionItem label="View client history" />
                          <PermissionItem label="Generate reports" />
                        </>
                      )}
                      {selectedRole === 'viewer' && (
                        <>
                          <PermissionItem label="View assigned clients" />
                          <PermissionItem label="Read session transcripts" />
                          <PermissionItem label="View reports" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function PermissionItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
      {label}
    </div>
  )
}
