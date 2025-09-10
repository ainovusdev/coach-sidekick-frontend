'use client'

import { useState, useEffect } from 'react'
import PageLayout from '@/components/layout/page-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { PermissionGate } from '@/contexts/permission-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { adminService } from '@/services/admin-service'
import { 
  Users, 
  Shield, 
  Lock, 
  Eye,
  Search,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface User {
  id: string
  email: string
  full_name: string | null
  roles: string[]
}

interface Client {
  id: string
  name: string
  email: string | null
  coach_id: string
  coach_name: string | null
  has_access: boolean
  access_level: string | null
}

export default function AccessManagementPage() {
  const [selectedRole, setSelectedRole] = useState<string>('viewer')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [clientChanges, setClientChanges] = useState<Map<string, boolean>>(new Map())

  // Fetch users by role
  useEffect(() => {
    fetchUsersByRole()
  }, [selectedRole]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch clients when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchClientsForUser()
    }
  }, [selectedUser]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsersByRole = async () => {
    try {
      setLoading(true)
      const response = await adminService.getUsersByRole(selectedRole)
      setUsers(response)
      setSelectedUser(null)
      setClients([])
    } catch (error) {
      console.error('Error fetching users:', error)
      setMessage({ type: 'error', text: 'Failed to load users' })
    } finally {
      setLoading(false)
    }
  }

  const fetchClientsForUser = async () => {
    if (!selectedUser) return
    
    try {
      setLoading(true)
      const response = await adminService.getClientsForAssignment(selectedUser.id)
      setClients(response)
      setClientChanges(new Map())
    } catch (error) {
      console.error('Error fetching clients:', error)
      setMessage({ type: 'error', text: 'Failed to load clients' })
    } finally {
      setLoading(false)
    }
  }

  const handleClientToggle = (clientId: string, currentAccess: boolean) => {
    const newChanges = new Map(clientChanges)
    
    // If the change brings it back to original state, remove from changes
    const client = clients.find(c => c.id === clientId)
    if (client && client.has_access === !currentAccess) {
      newChanges.delete(clientId)
    } else {
      newChanges.set(clientId, !currentAccess)
    }
    
    setClientChanges(newChanges)
  }

  const saveChanges = async () => {
    if (!selectedUser || clientChanges.size === 0) return
    
    try {
      setSaving(true)
      
      for (const [clientId, shouldHaveAccess] of clientChanges) {
        const client = clients.find(c => c.id === clientId)
        if (!client) continue
        
        if (shouldHaveAccess && !client.has_access) {
          // Grant access
          await adminService.assignClientAccess({
            client_id: clientId,
            user_id: selectedUser.id,
            access_level: 'view'
          })
        } else if (!shouldHaveAccess && client.has_access) {
          // Revoke access
          await adminService.removeClientAccess(clientId, selectedUser.id)
        }
      }
      
      setMessage({ type: 'success', text: 'Access permissions updated successfully' })
      await fetchClientsForUser() // Refresh the list
    } catch (error) {
      console.error('Error saving changes:', error)
      setMessage({ type: 'error', text: 'Failed to save changes' })
    } finally {
      setSaving(false)
    }
  }

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'super_admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'admin': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'coach': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'viewer': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <ProtectedRoute>
      <PermissionGate 
        resource="access" 
        action="manage"
        fallback={
          <PageLayout>
            <div className="flex items-center justify-center min-h-screen">
              <Card className="max-w-md">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Lock className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                    <p className="text-gray-600">You don&apos;t have permission to manage access controls.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </PageLayout>
        }
      >
        <PageLayout>
          <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Access Management</h1>
                <p className="text-gray-600 mt-2">Manage user permissions and client access assignments</p>
              </div>

              {/* Message Alert */}
              {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {message.text}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Selection Panel */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Select User
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Role Selector */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Filter by Role
                      </label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewers</SelectItem>
                          <SelectItem value="coach">Coaches</SelectItem>
                          <SelectItem value="admin">Admins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* User List */}
                    <div className="space-y-2">
                      {loading && !users.length ? (
                        <div className="text-center py-4 text-gray-500">Loading users...</div>
                      ) : users.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No users found</div>
                      ) : (
                        users.map(user => (
                          <button
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedUser?.id === user.id
                                ? 'bg-gray-100 border-gray-300'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium text-gray-900">{user.email}</div>
                            {user.full_name && (
                              <div className="text-sm text-gray-500">{user.full_name}</div>
                            )}
                            <div className="mt-1">
                              {user.roles.map(role => (
                                <Badge 
                                  key={role}
                                  className={`text-xs mr-1 ${getRoleBadgeColor(role)}`}
                                >
                                  {role.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Client Access Panel */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Client Access
                      </CardTitle>
                      {clientChanges.size > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                            {clientChanges.size} pending changes
                          </Badge>
                          <Button
                            onClick={saveChanges}
                            disabled={saving}
                            className="bg-gray-900 hover:bg-gray-800 text-white"
                          >
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!selectedUser ? (
                      <div className="text-center py-12 text-gray-500">
                        <Lock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Select a user to manage their client access</p>
                      </div>
                    ) : (
                      <>
                        {/* Selected User Info */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{selectedUser.email}</p>
                              {selectedUser.full_name && (
                                <p className="text-sm text-gray-600">{selectedUser.full_name}</p>
                              )}
                            </div>
                            <Badge className={getRoleBadgeColor(selectedUser.roles[0])}>
                              {selectedUser.roles[0].replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search clients..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        {/* Client List */}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {loading ? (
                            <div className="text-center py-4 text-gray-500">Loading clients...</div>
                          ) : filteredClients.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">No clients found</div>
                          ) : (
                            filteredClients.map(client => {
                              const hasChange = clientChanges.has(client.id)
                              const currentAccess = hasChange 
                                ? clientChanges.get(client.id)! 
                                : client.has_access
                              
                              return (
                                <div
                                  key={client.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border ${
                                    hasChange ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={currentAccess}
                                      onCheckedChange={() => handleClientToggle(client.id, currentAccess)}
                                    />
                                    <div>
                                      <p className="font-medium text-gray-900">{client.name}</p>
                                      <p className="text-sm text-gray-500">
                                        Coach: {client.coach_name || client.coach_id}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {currentAccess ? (
                                      <Badge className="bg-green-100 text-green-800 border-green-200">
                                        <Eye className="h-3 w-3 mr-1" />
                                        Has Access
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-gray-500">
                                        <Lock className="h-3 w-3 mr-1" />
                                        No Access
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>

                        {/* Info Note */}
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                            <p className="text-sm text-blue-800">
                              Viewers have read-only access to assigned clients. They cannot modify client information or export data.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </PageLayout>
      </PermissionGate>
    </ProtectedRoute>
  )
}