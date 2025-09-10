'use client'

import { useState, useEffect } from 'react'
import { adminService, User } from '@/services/admin-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import {
  Search,
  MoreVertical,
  Shield,
  Edit,
  Trash2,
  UserPlus,
  LockKeyhole,
  CheckCircle,
  XCircle,
  Users,
  UserCheck,
  Eye,
  Filter,
  Download,
  Mail,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const { toast } = useToast()

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    roles: [] as string[],
    is_active: true,
  })

  useEffect(() => {
    fetchUsers()
    fetchAvailableRoles()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async (search?: string, roleFilter?: string) => {
    try {
      setLoading(true)
      const params: any = { limit: 1000 }
      if (search) params.search = search
      if (roleFilter && roleFilter !== 'all') params.role_filter = roleFilter

      const data = await adminService.getUsers(params)
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableRoles = async () => {
    try {
      const data = await adminService.getAvailableRoles()
      setAvailableRoles(data.roles)
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    fetchUsers(query, selectedRole)
  }

  const handleRoleFilter = (role: string) => {
    setSelectedRole(role)
    fetchUsers(searchQuery, role)
  }

  const handleCreateUser = async () => {
    try {
      await adminService.createUser(formData)
      toast({
        title: 'Success',
        description: 'User created successfully',
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to create user:', error)
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      await adminService.updateUser(selectedUser.id, {
        email: formData.email,
        full_name: formData.full_name,
        is_active: formData.is_active,
        password: formData.password || undefined,
      })

      // Update roles separately
      await adminService.assignRoles(selectedUser.id, formData.roles)

      toast({
        title: 'Success',
        description: 'User updated successfully',
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      console.log(error)

      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateRoles = async () => {
    if (!selectedUser) return

    try {
      await adminService.assignRoles(selectedUser.id, formData.roles)
      toast({
        title: 'Success',
        description: 'Roles updated successfully',
      })
      setIsRoleDialogOpen(false)
      fetchUsers()
    } catch (error: any) {
      console.log(error)

      toast({
        title: 'Error',
        description: 'Failed to update roles',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      await adminService.deleteUser(selectedUser.id)
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      })
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error: any) {
      console.log(error)

      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      })
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      full_name: user.full_name || '',
      password: '',
      roles: user.roles,
      is_active: user.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const openRoleDialog = (user: User) => {
    setSelectedUser(user)
    setFormData(prev => ({ ...prev, roles: user.roles }))
    setIsRoleDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      password: '',
      roles: [],
      is_active: true,
    })
    setSelectedUser(null)
  }

  const getRoleBadgeVariant = (role: string): any => {
    switch (role) {
      case 'super_admin':
        return 'destructive'
      case 'admin':
        return 'default'
      case 'coach':
        return 'secondary'
      case 'viewer':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const formatRoleName = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

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

  // Calculate statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    admins: users.filter(
      u => u.roles.includes('admin') || u.roles.includes('super_admin'),
    ).length,
    coaches: users.filter(u => u.roles.includes('coach')).length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Stats */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-500 mt-2">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total
                </CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Inactive
                </CardTitle>
                <XCircle className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">
                {stats.inactive}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Admins
                </CardTitle>
                <Shield className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.admins}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Coaches
                </CardTitle>
                <UserCheck className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.coaches}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {selectedRole === 'all'
                      ? 'All Roles'
                      : formatRoleName(selectedRole)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRoleFilter('all')}>
                    All Roles
                  </DropdownMenuItem>
                  {availableRoles.map(role => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => handleRoleFilter(role)}
                    >
                      {formatRoleName(role)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Client Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 font-medium">
                            {getUserInitials(user.email, user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.full_name || user.email}
                          </p>
                          {user.full_name && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.length > 0 ? (
                          user.roles.map(role => (
                            <Badge
                              key={role}
                              variant={getRoleBadgeVariant(role)}
                              className="text-xs"
                            >
                              {formatRoleName(role)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">
                            No roles
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {user.client_count}
                        </span>
                        <span className="text-sm text-gray-500">clients</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.is_active ? (
                          <>
                            <div className="h-2 w-2 bg-green-500 rounded-full" />
                            <span className="text-sm text-green-700">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 bg-gray-400 rounded-full" />
                            <span className="text-sm text-gray-500">
                              Inactive
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              openEditDialog(user)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              openRoleDialog(user)
                            }}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Manage Roles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <LockKeyhole className="h-4 w-4 mr-2" />
                            Client Access
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              openDeleteDialog(user)
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system and assign roles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={e =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label>Roles</Label>
              <div className="space-y-2 mt-2">
                {availableRoles.map(role => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`create-${role}`}
                      checked={formData.roles.includes(role)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            roles: [...formData.roles, role],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            roles: formData.roles.filter(r => r !== role),
                          })
                        }
                      }}
                    />
                    <Label
                      htmlFor={`create-${role}`}
                      className="font-normal cursor-pointer"
                    >
                      {formatRoleName(role)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active Account</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={checked =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-full_name">Full Name</Label>
              <Input
                id="edit-full_name"
                value={formData.full_name}
                onChange={e =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-password">
                New Password (leave empty to keep current)
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={e =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-is_active">Active Account</Label>
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={checked =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Roles Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Roles</DialogTitle>
            <DialogDescription>
              Assign or remove roles for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {availableRoles.map(role => (
              <div
                key={role}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`role-${role}`}
                    checked={formData.roles.includes(role)}
                    onCheckedChange={checked => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          roles: [...formData.roles, role],
                        })
                      } else {
                        setFormData({
                          ...formData,
                          roles: formData.roles.filter(r => r !== role),
                        })
                      }
                    }}
                  />
                  <div>
                    <Label
                      htmlFor={`role-${role}`}
                      className="font-medium cursor-pointer"
                    >
                      {formatRoleName(role)}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {role === 'super_admin' &&
                        'Full system access and control'}
                      {role === 'admin' && 'User and client management'}
                      {role === 'coach' && 'Access to coaching sessions'}
                      {role === 'viewer' && 'Read-only access'}
                    </p>
                  </div>
                </div>
                <Badge variant={getRoleBadgeVariant(role)}>
                  {role === 'super_admin' && (
                    <Shield className="h-3 w-3 mr-1" />
                  )}
                  {role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                  {role === 'coach' && <UserCheck className="h-3 w-3 mr-1" />}
                  {role === 'viewer' && <Eye className="h-3 w-3 mr-1" />}
                  {formatRoleName(role)}
                </Badge>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateRoles}>Update Roles</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription className="space-y-2">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p>Are you sure you want to delete this user?</p>
              <p className="font-semibold">{selectedUser?.email}</p>
              <p className="text-red-600">This action cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
