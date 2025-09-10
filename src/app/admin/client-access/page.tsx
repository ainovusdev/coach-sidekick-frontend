'use client'

import { useState, useEffect } from 'react'
import { adminService, ClientAccessMatrix, User as UserType } from '@/services/admin-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  Plus, 
  Users,
  UserPlus,
  UserMinus,
  Eye,
  Edit2,
  Shield,
  Network,
  Building,
  User,
  UserCheck
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSearchParams } from 'next/navigation'

interface HierarchyNode {
  type: 'admin' | 'coach' | 'client'
  id: string
  name: string
  email?: string
  children: HierarchyNode[]
  roles?: string[]
  access_level?: string
}

export default function ClientAccessPage() {
  const [accessMatrix, setAccessMatrix] = useState<ClientAccessMatrix[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'hierarchy' | 'list'>('hierarchy')
  const [isGrantAccessDialogOpen, setIsGrantAccessDialogOpen] = useState(false)
  const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientAccessMatrix | null>(null)
  const [hierarchyData, setHierarchyData] = useState<HierarchyNode[]>([])
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const userFilter = searchParams.get('user')
  
  // Form states
  const [grantAccessForm, setGrantAccessForm] = useState({
    client_id: '',
    user_id: '',
    access_level: 'full' as 'full' | 'readonly'
  })
  
  const [bulkAssignForm, setBulkAssignForm] = useState({
    user_id: '',
    client_ids: [] as string[],
    access_level: 'full' as 'full' | 'readonly'
  })

  useEffect(() => {
    fetchAccessMatrix()
    fetchUsers()
    
    // If user filter is present, open bulk assign dialog
    if (userFilter) {
      setBulkAssignForm(prev => ({ ...prev, user_id: userFilter }))
      setIsBulkAssignDialogOpen(true)
    }
  }, [userFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (accessMatrix.length > 0 && users.length > 0) {
      const hierarchy = buildHierarchy()
      setHierarchyData(hierarchy)
    }
  }, [accessMatrix, users]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAccessMatrix = async () => {
    try {
      setLoading(true)
      const data = await adminService.getAccessMatrix({ limit: 100 })
      setAccessMatrix(data)
    } catch (error) {
      console.error('Failed to fetch access matrix:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch client access data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers({ limit: 1000 })
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const buildHierarchy = (): HierarchyNode[] => {
    const hierarchy: HierarchyNode[] = []
    const admins = users.filter(u => u.roles.includes('admin') || u.roles.includes('super_admin'))
    const coaches = users.filter(u => u.roles.includes('coach'))
    
    // Build admin -> coach -> client hierarchy
    admins.forEach(admin => {
      const adminNode: HierarchyNode = {
        type: 'admin',
        id: admin.id,
        name: admin.full_name || admin.email,
        email: admin.email,
        roles: admin.roles,
        children: []
      }
      
      // For super admins, show all coaches and clients
      if (admin.roles.includes('super_admin')) {
        coaches.forEach(coach => {
          const coachNode: HierarchyNode = {
            type: 'coach',
            id: coach.id,
            name: coach.full_name || coach.email,
            email: coach.email,
            roles: coach.roles,
            children: []
          }
          
          // Add clients under coach
          accessMatrix.forEach(client => {
            const coachHasAccess = client.assigned_users.some(u => u.user_id === coach.id)
            if (coachHasAccess) {
              const accessInfo = client.assigned_users.find(u => u.user_id === coach.id)
              coachNode.children.push({
                type: 'client',
                id: client.client_id,
                name: client.client_name,
                access_level: accessInfo?.access_level,
                children: []
              })
            }
          })
          
          if (coachNode.children.length > 0) {
            adminNode.children.push(coachNode)
          }
        })
      } else {
        // Regular admins see their assigned coaches/clients
        accessMatrix.forEach(client => {
          const adminHasAccess = client.assigned_users.some(u => u.user_id === admin.id)
          if (adminHasAccess) {
            const accessInfo = client.assigned_users.find(u => u.user_id === admin.id)
            adminNode.children.push({
              type: 'client',
              id: client.client_id,
              name: client.client_name,
              access_level: accessInfo?.access_level,
              children: []
            })
          }
        })
      }
      
      if (adminNode.children.length > 0) {
        hierarchy.push(adminNode)
      }
    })
    
    // Add coaches with their clients
    coaches.forEach(coach => {
      const coachNode: HierarchyNode = {
        type: 'coach',
        id: coach.id,
        name: coach.full_name || coach.email,
        email: coach.email,
        roles: coach.roles,
        children: []
      }
      
      accessMatrix.forEach(client => {
        const coachHasAccess = client.assigned_users.some(u => u.user_id === coach.id)
        if (coachHasAccess) {
          const accessInfo = client.assigned_users.find(u => u.user_id === coach.id)
          coachNode.children.push({
            type: 'client',
            id: client.client_id,
            name: client.client_name,
            access_level: accessInfo?.access_level,
            children: []
          })
        }
      })
      
      // Only add if not already in hierarchy under an admin
      const existsInHierarchy = hierarchy.some(admin =>
        admin.children.some(c => c.id === coach.id)
      )
      
      if (coachNode.children.length > 0 && !existsInHierarchy) {
        hierarchy.push(coachNode)
      }
    })
    
    return hierarchy
  }

  const handleGrantAccess = async () => {
    try {
      await adminService.grantClientAccess(grantAccessForm)
      toast({
        title: 'Success',
        description: 'Access granted successfully'
      })
      setIsGrantAccessDialogOpen(false)
      fetchAccessMatrix()
      resetGrantAccessForm()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to grant access',
        variant: 'destructive'
      })
    }
  }

  const handleBulkAssign = async () => {
    try {
      const result = await adminService.bulkAssignClients(bulkAssignForm)
      toast({
        title: 'Success',
        description: `${result.assigned_count} clients assigned successfully`
      })
      setIsBulkAssignDialogOpen(false)
      fetchAccessMatrix()
      resetBulkAssignForm()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to assign clients',
        variant: 'destructive'
      })
    }
  }

  const handleRevokeAccess = async (clientId: string, userId: string) => {
    if (!confirm('Are you sure you want to revoke this access?')) return
    
    try {
      await adminService.revokeClientAccess(clientId, userId)
      toast({
        title: 'Success',
        description: 'Access revoked successfully'
      })
      fetchAccessMatrix()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to revoke access',
        variant: 'destructive'
      })
    }
  }

  const openGrantAccessDialog = (client?: ClientAccessMatrix) => {
    if (client) {
      setSelectedClient(client)
      setGrantAccessForm(prev => ({ ...prev, client_id: client.client_id }))
    }
    setIsGrantAccessDialogOpen(true)
  }

  const resetGrantAccessForm = () => {
    setGrantAccessForm({
      client_id: '',
      user_id: '',
      access_level: 'full'
    })
    setSelectedClient(null)
  }

  const resetBulkAssignForm = () => {
    setBulkAssignForm({
      user_id: '',
      client_ids: [],
      access_level: 'full'
    })
  }

  const filteredMatrix = accessMatrix.filter(client =>
    searchQuery === '' ||
    client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.assigned_users.some(user =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'coach':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatRoleName = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'coach':
        return <UserCheck className="h-4 w-4" />
      case 'client':
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'admin':
        return 'bg-purple-100 text-purple-700'
      case 'coach':
        return 'bg-blue-100 text-blue-700'
      case 'client':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const renderHierarchyNode = (node: HierarchyNode, level: number = 0) => {
    const isSuper = node.roles?.includes('super_admin')
    
    return (
      <div key={node.id} className={`${level > 0 ? 'ml-8' : ''}`}>
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className={`p-2 rounded-lg ${getNodeColor(node.type)}`}>
            {getNodeIcon(node.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{node.name}</span>
              {node.email && (
                <span className="text-xs text-gray-500">({node.email})</span>
              )}
              {isSuper && (
                <Badge variant="destructive" className="text-xs">
                  Super Admin
                </Badge>
              )}
              {node.type === 'admin' && !isSuper && (
                <Badge variant="default" className="text-xs">
                  Admin
                </Badge>
              )}
              {node.access_level && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-xs',
                    node.access_level === 'full' 
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  )}
                >
                  {node.access_level === 'full' ? 'Full Access' : 'Read Only'}
                </Badge>
              )}
            </div>
            {node.type === 'client' && (
              <p className="text-xs text-gray-500 mt-0.5">Client Account</p>
            )}
          </div>
          {node.children.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Network className="h-3 w-3" />
              <span>{node.children.length}</span>
            </div>
          )}
        </div>
        {node.children.length > 0 && (
          <div className="ml-4 border-l-2 border-gray-200 pl-4 mt-2">
            {node.children.map(child => renderHierarchyNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Access</h1>
          <p className="text-gray-500 mt-2">Manage client access assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkAssignDialogOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Bulk Assign
          </Button>
          <Button onClick={() => openGrantAccessDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Grant Access
          </Button>
        </div>
      </div>

      {/* View Toggle and Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'hierarchy' | 'list')}>
              <TabsList>
                <TabsTrigger value="hierarchy">
                  <Network className="h-4 w-4 mr-2" />
                  Hierarchy View
                </TabsTrigger>
                <TabsTrigger value="list">
                  <Users className="h-4 w-4 mr-2" />
                  List View
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content based on view mode */}
      {viewMode === 'hierarchy' ? (
        // Hierarchy View
        <Card>
          <CardHeader>
            <CardTitle>Access Hierarchy</CardTitle>
            <CardDescription>
              Visual representation of admin → coach → client relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : hierarchyData.length === 0 ? (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hierarchy data available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {hierarchyData.map(node => renderHierarchyNode(node))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // List View (existing table)
        loading ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Assigned Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Assigned Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatrix.map((client) => (
                <TableRow key={client.client_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{client.client_name}</p>
                        <p className="text-xs text-gray-500">ID: {client.client_id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.assigned_users.length > 0 ? (
                      <div className="space-y-2">
                        {client.assigned_users.map(user => (
                          <div key={user.user_id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {user.email}
                                </p>
                                {user.full_name && (
                                  <p className="text-xs text-gray-500">{user.full_name}</p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {user.roles.map(role => (
                                  <Badge
                                    key={role}
                                    variant="outline"
                                    className={cn('text-xs', getRoleBadgeColor(role))}
                                  >
                                    {formatRoleName(role)}
                                  </Badge>
                                ))}
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  'text-xs',
                                  user.access_level === 'full' 
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                )}
                              >
                                {user.access_level === 'full' ? (
                                  <Edit2 className="h-3 w-3 mr-1" />
                                ) : (
                                  <Eye className="h-3 w-3 mr-1" />
                                )}
                                {user.access_level === 'full' ? 'Full Access' : 'Read Only'}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeAccess(client.client_id, user.user_id)}
                            >
                              <UserMinus className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No users assigned</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openGrantAccessDialog(client)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

      {/* Grant Access Dialog */}
      <Dialog open={isGrantAccessDialogOpen} onOpenChange={setIsGrantAccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Client Access</DialogTitle>
            <DialogDescription>
              Assign a user to a client with specific access level
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="client">Client</Label>
              {selectedClient ? (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <p className="font-medium">{selectedClient.client_name}</p>
                  <p className="text-xs text-gray-500">ID: {selectedClient.client_id}</p>
                </div>
              ) : (
                <Select
                  value={grantAccessForm.client_id}
                  onValueChange={(value) => 
                    setGrantAccessForm(prev => ({ ...prev, client_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessMatrix.map(client => (
                      <SelectItem key={client.client_id} value={client.client_id}>
                        {client.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label htmlFor="user">User</Label>
              <Select
                value={grantAccessForm.user_id}
                onValueChange={(value) => 
                  setGrantAccessForm(prev => ({ ...prev, user_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email} {user.full_name && `(${user.full_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="access_level">Access Level</Label>
              <Select
                value={grantAccessForm.access_level}
                onValueChange={(value: 'full' | 'readonly') => 
                  setGrantAccessForm(prev => ({ ...prev, access_level: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">
                    <div className="flex items-center gap-2">
                      <Edit2 className="h-4 w-4" />
                      Full Access
                    </div>
                  </SelectItem>
                  <SelectItem value="readonly">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Read Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsGrantAccessDialogOpen(false)
              resetGrantAccessForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleGrantAccess}>
              Grant Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={isBulkAssignDialogOpen} onOpenChange={setIsBulkAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Assign Clients</DialogTitle>
            <DialogDescription>
              Assign multiple clients to a user at once
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-user">User</Label>
              <Select
                value={bulkAssignForm.user_id}
                onValueChange={(value) => 
                  setBulkAssignForm(prev => ({ ...prev, user_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email} {user.full_name && `(${user.full_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bulk-access_level">Access Level</Label>
              <Select
                value={bulkAssignForm.access_level}
                onValueChange={(value: 'full' | 'readonly') => 
                  setBulkAssignForm(prev => ({ ...prev, access_level: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">
                    <div className="flex items-center gap-2">
                      <Edit2 className="h-4 w-4" />
                      Full Access
                    </div>
                  </SelectItem>
                  <SelectItem value="readonly">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Read Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Clients</Label>
              <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                <div className="p-2 space-y-2">
                  {accessMatrix.map(client => (
                    <div key={client.client_id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={`client-${client.client_id}`}
                        checked={bulkAssignForm.client_ids.includes(client.client_id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBulkAssignForm(prev => ({ 
                              ...prev, 
                              client_ids: [...prev.client_ids, client.client_id] 
                            }))
                          } else {
                            setBulkAssignForm(prev => ({ 
                              ...prev, 
                              client_ids: prev.client_ids.filter(id => id !== client.client_id) 
                            }))
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`client-${client.client_id}`} 
                        className="text-sm font-normal flex-1 cursor-pointer"
                      >
                        {client.client_name}
                        {client.assigned_users.length > 0 && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({client.assigned_users.length} users assigned)
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {bulkAssignForm.client_ids.length} clients selected
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsBulkAssignDialogOpen(false)
              resetBulkAssignForm()
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAssign}
              disabled={bulkAssignForm.client_ids.length === 0 || !bulkAssignForm.user_id}
            >
              Assign {bulkAssignForm.client_ids.length} Clients
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}