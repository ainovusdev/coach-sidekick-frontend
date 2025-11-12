'use client'

import { useState, useMemo } from 'react'
import { ClientAccessMatrix, User as UserType } from '@/services/admin-service'
import {
  useGrantClientAccess,
  useBulkAssignClients,
  useRevokeClientAccess,
} from '@/hooks/mutations/use-admin-access-mutations'
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Loader2,
} from 'lucide-react'

interface ClientAccessViewProps {
  users: UserType[]
  accessMatrix: ClientAccessMatrix[]
  coachAccessList: any[]
  isLoading: boolean
  isFetching: boolean
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function ClientAccessView({
  users,
  accessMatrix,
  coachAccessList: _coachAccessList,
  isLoading,
  isFetching,
}: ClientAccessViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isGrantAccessDialogOpen, setIsGrantAccessDialogOpen] = useState(false)
  const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] =
    useState<ClientAccessMatrix | null>(null)

  // Form states
  const [grantAccessForm, setGrantAccessForm] = useState({
    client_id: '',
    user_id: '',
    access_level: 'full' as 'full' | 'readonly',
  })

  const [bulkAssignForm, setBulkAssignForm] = useState({
    user_id: '',
    client_ids: [] as string[],
    access_level: 'full' as 'full' | 'readonly',
  })

  // Mutation hooks
  const { mutate: grantAccess, isPending: isGranting } = useGrantClientAccess()
  const { mutate: bulkAssign, isPending: isBulkAssigning } =
    useBulkAssignClients()
  const { mutate: revokeAccess, isPending: isRevoking } =
    useRevokeClientAccess()

  const handleGrantAccess = () => {
    grantAccess(grantAccessForm, {
      onSuccess: () => {
        setIsGrantAccessDialogOpen(false)
        resetGrantAccessForm()
      },
    })
  }

  const handleBulkAssign = () => {
    bulkAssign(bulkAssignForm, {
      onSuccess: () => {
        setIsBulkAssignDialogOpen(false)
        resetBulkAssignForm()
      },
    })
  }

  const handleRevokeAccess = (clientId: string, userId: string) => {
    if (!confirm('Are you sure you want to revoke this access?')) return

    revokeAccess({ clientId, userId })
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
      access_level: 'full',
    })
    setSelectedClient(null)
  }

  const resetBulkAssignForm = () => {
    setBulkAssignForm({
      user_id: '',
      client_ids: [],
      access_level: 'full',
    })
  }

  const filteredMatrix = useMemo(() => {
    return accessMatrix.filter(
      client =>
        searchQuery === '' ||
        client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.assigned_users.some(
          user =>
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    )
  }, [accessMatrix, searchQuery])

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
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="p-0">
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
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Client Access Management</CardTitle>
              <CardDescription>
                Manage individual client access permissions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isFetching && (
                <Badge variant="secondary" className="text-xs">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Updating...
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkAssignDialogOpen(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Bulk Assign
              </Button>
              <Button onClick={() => openGrantAccessDialog()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Grant Access
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients or users..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Client Access Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Assigned Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatrix.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No clients found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMatrix.map(client => (
                  <TableRow key={client.client_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{client.client_name}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {client.client_id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.assigned_users.length > 0 ? (
                        <div className="space-y-2">
                          {client.assigned_users.map(user => (
                            <div
                              key={user.user_id}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <div>
                                  <p className="text-sm font-medium">
                                    {user.email}
                                  </p>
                                  {user.full_name && (
                                    <p className="text-xs text-muted-foreground">
                                      {user.full_name}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                  {user.is_owner && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Owner
                                    </Badge>
                                  )}
                                  {user.roles.map(role => (
                                    <Badge
                                      key={role}
                                      variant="outline"
                                      className={cn(
                                        'text-xs',
                                        getRoleBadgeColor(role),
                                      )}
                                    >
                                      {formatRoleName(role)}
                                    </Badge>
                                  ))}
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-xs',
                                      user.access_level === 'full' ? '' : '',
                                    )}
                                  >
                                    {user.access_level === 'full' ? (
                                      <Edit2 className="h-3 w-3 mr-1" />
                                    ) : (
                                      <Eye className="h-3 w-3 mr-1" />
                                    )}
                                    {user.access_level === 'full'
                                      ? 'Full Access'
                                      : 'Read Only'}
                                  </Badge>
                                </div>
                              </div>
                              {!user.is_owner && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isRevoking}
                                  onClick={() =>
                                    handleRevokeAccess(
                                      client.client_id,
                                      user.user_id,
                                    )
                                  }
                                >
                                  <UserMinus className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No users assigned
                        </p>
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Grant Access Dialog */}
      <Dialog
        open={isGrantAccessDialogOpen}
        onOpenChange={setIsGrantAccessDialogOpen}
      >
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
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="font-medium">{selectedClient.client_name}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {selectedClient.client_id}
                  </p>
                </div>
              ) : (
                <Select
                  value={grantAccessForm.client_id}
                  onValueChange={value =>
                    setGrantAccessForm(prev => ({ ...prev, client_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessMatrix.map(client => (
                      <SelectItem
                        key={client.client_id}
                        value={client.client_id}
                      >
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
                onValueChange={value =>
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
            <Button
              variant="outline"
              onClick={() => {
                setIsGrantAccessDialogOpen(false)
                resetGrantAccessForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleGrantAccess} disabled={isGranting}>
              {isGranting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Granting...
                </>
              ) : (
                'Grant Access'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog
        open={isBulkAssignDialogOpen}
        onOpenChange={setIsBulkAssignDialogOpen}
      >
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
                onValueChange={value =>
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
                    <div
                      key={client.client_id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded"
                    >
                      <Checkbox
                        id={`client-${client.client_id}`}
                        checked={bulkAssignForm.client_ids.includes(
                          client.client_id,
                        )}
                        onCheckedChange={checked => {
                          if (checked) {
                            setBulkAssignForm(prev => ({
                              ...prev,
                              client_ids: [
                                ...prev.client_ids,
                                client.client_id,
                              ],
                            }))
                          } else {
                            setBulkAssignForm(prev => ({
                              ...prev,
                              client_ids: prev.client_ids.filter(
                                id => id !== client.client_id,
                              ),
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
                          <span className="text-xs text-muted-foreground ml-2">
                            ({client.assigned_users.length} users assigned)
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {bulkAssignForm.client_ids.length} clients selected
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkAssignDialogOpen(false)
                resetBulkAssignForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={
                bulkAssignForm.client_ids.length === 0 ||
                !bulkAssignForm.user_id ||
                isBulkAssigning
              }
            >
              {isBulkAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                `Assign ${bulkAssignForm.client_ids.length} Clients`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
