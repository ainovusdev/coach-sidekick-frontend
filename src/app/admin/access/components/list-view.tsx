'use client'

import { useState, useMemo } from 'react'
import { ClientAccessMatrix, User as UserType } from '@/services/admin-service'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Users, Shield, UserCheck, Filter, Loader2 } from 'lucide-react'

interface ListViewProps {
  users: UserType[]
  accessMatrix: ClientAccessMatrix[]
  coachAccessList: any[]
  isLoading: boolean
  isFetching: boolean
}

interface AccessRelationship {
  type: 'coach_delegation' | 'client_access'
  admin?: UserType
  coach?: UserType
  client?: ClientAccessMatrix
  user?: UserType
  access_level?: string
  is_owner?: boolean
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function ListView({
  users,
  accessMatrix,
  coachAccessList,
  isLoading,
  isFetching,
}: ListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<
    'all' | 'coach_delegation' | 'client_access'
  >('all')

  // Build comprehensive relationship list
  const relationships = useMemo(() => {
    const relations: AccessRelationship[] = []

    // Add coach delegations
    coachAccessList.forEach(ca => {
      const admin = users.find(u => u.id === ca.admin_user_id)
      const coach = users.find(u => u.id === ca.coach_user_id)

      if (admin && coach) {
        relations.push({
          type: 'coach_delegation',
          admin,
          coach,
        })
      }
    })

    // Add client access grants
    accessMatrix.forEach(client => {
      client.assigned_users.forEach(assignedUser => {
        const user = users.find(u => u.id === assignedUser.user_id)

        if (user) {
          relations.push({
            type: 'client_access',
            client,
            user,
            access_level: assignedUser.access_level,
            is_owner: assignedUser.is_owner,
          })
        }
      })
    })

    return relations
  }, [users, accessMatrix, coachAccessList])

  // Filter relationships
  const filteredRelationships = useMemo(() => {
    return relationships.filter(rel => {
      // Type filter
      if (typeFilter !== 'all' && rel.type !== typeFilter) {
        return false
      }

      // Search filter
      if (searchQuery === '') return true

      const query = searchQuery.toLowerCase()

      if (rel.type === 'coach_delegation') {
        return (
          rel.admin?.email.toLowerCase().includes(query) ||
          rel.admin?.full_name?.toLowerCase().includes(query) ||
          rel.coach?.email.toLowerCase().includes(query) ||
          rel.coach?.full_name?.toLowerCase().includes(query)
        )
      } else {
        return (
          rel.client?.client_name.toLowerCase().includes(query) ||
          rel.user?.email.toLowerCase().includes(query) ||
          rel.user?.full_name?.toLowerCase().includes(query)
        )
      }
    })
  }, [relationships, searchQuery, typeFilter])

  const stats = useMemo(() => {
    const totalCoachDelegations = relationships.filter(
      r => r.type === 'coach_delegation',
    ).length
    const totalClientGrants = relationships.filter(
      r => r.type === 'client_access',
    ).length

    return {
      totalCoachDelegations,
      totalClientGrants,
      totalRelationships: totalCoachDelegations + totalClientGrants,
    }
  }, [relationships])

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
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
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
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Access Relationships</CardTitle>
              <CardDescription>
                Comprehensive view of all coach delegations and client access
                grants
              </CardDescription>
            </div>
            {isFetching && (
              <Badge variant="secondary" className="text-xs">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Updating...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or client..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={typeFilter}
                onValueChange={(value: any) => setTypeFilter(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="coach_delegation">
                    Coach Delegations
                  </SelectItem>
                  <SelectItem value="client_access">Client Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Relationships
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRelationships}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All access relationships
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Coach Delegations
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCoachDelegations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Admin → Coach assignments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Grants</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientGrants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              User → Client permissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Relationships Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRelationships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      No relationships found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRelationships.map((rel, index) => {
                  if (rel.type === 'coach_delegation') {
                    return (
                      <TableRow key={`cd-${index}`}>
                        <TableCell>
                          <Badge
                            variant="default"
                            className="whitespace-nowrap"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Coach Delegation
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {rel.admin?.full_name || rel.admin?.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {rel.admin?.full_name ? rel.admin.email : ''}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {rel.admin?.roles.map(role => (
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
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {rel.coach?.full_name || rel.coach?.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {rel.coach?.full_name ? rel.coach.email : ''}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {rel.coach?.roles.map(role => (
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
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            All Clients
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  } else {
                    return (
                      <TableRow key={`ca-${index}`}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="whitespace-nowrap"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Client Access
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {rel.user?.full_name || rel.user?.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {rel.user?.full_name ? rel.user.email : ''}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {rel.user?.roles.map(role => (
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
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {rel.client?.client_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {rel.client?.client_id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {rel.is_owner && (
                              <Badge variant="secondary" className="text-xs">
                                Owner
                              </Badge>
                            )}
                            <Badge
                              variant={
                                rel.access_level === 'full'
                                  ? 'default'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {rel.access_level === 'full'
                                ? 'Full Access'
                                : 'Read Only'}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {searchQuery || typeFilter !== 'all' ? (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredRelationships.length} of {relationships.length}{' '}
          relationships
        </div>
      ) : null}
    </div>
  )
}
