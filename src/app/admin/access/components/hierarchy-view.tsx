'use client'

import { useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, UserCheck, User, Network, Building } from 'lucide-react'
import { ClientAccessMatrix, User as UserType } from '@/services/admin-service'

interface HierarchyNode {
  type: 'admin' | 'coach' | 'client'
  id: string
  name: string
  email?: string
  children: HierarchyNode[]
  roles?: string[]
  access_level?: string
  is_owner?: boolean
}

interface HierarchyViewProps {
  users: UserType[]
  accessMatrix: ClientAccessMatrix[]
  coachAccessList: any[]
  isLoading: boolean
  isFetching: boolean
}

export default function HierarchyView({
  users,
  accessMatrix,
  coachAccessList,
  isLoading,
  isFetching,
}: HierarchyViewProps) {
  // Build hierarchy function with useCallback
  const buildHierarchy = useCallback(
    (
      matrix: ClientAccessMatrix[],
      usersList: UserType[],
      coachAccessData: any[],
    ): HierarchyNode[] => {
      const hierarchy: HierarchyNode[] = []
      const admins = usersList.filter(
        u => u.roles.includes('admin') || u.roles.includes('super_admin'),
      )
      const coaches = usersList.filter(u => u.roles.includes('coach'))

      // Build admin -> coach -> client hierarchy
      admins.forEach(admin => {
        const adminNode: HierarchyNode = {
          type: 'admin',
          id: admin.id,
          name: admin.full_name || admin.email,
          email: admin.email,
          roles: admin.roles,
          children: [],
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
              children: [],
            }

            // Add clients under coach
            matrix.forEach(client => {
              const coachHasAccess = client.assigned_users.some(
                u => u.user_id === coach.id,
              )
              if (coachHasAccess) {
                const accessInfo = client.assigned_users.find(
                  u => u.user_id === coach.id,
                )
                coachNode.children.push({
                  type: 'client',
                  id: client.client_id,
                  name: client.client_name,
                  access_level: accessInfo?.access_level,
                  is_owner: accessInfo?.is_owner,
                  children: [],
                })
              }
            })

            if (coachNode.children.length > 0) {
              adminNode.children.push(coachNode)
            }
          })
        } else {
          // Regular admins see coaches assigned to them via CoachAccess
          const assignedCoachIds = coachAccessData
            .filter(ca => ca.admin_user_id === admin.id)
            .map(ca => ca.coach_user_id)

          assignedCoachIds.forEach(coachId => {
            const coach = coaches.find(c => c.id === coachId)
            if (!coach) return

            const coachNode: HierarchyNode = {
              type: 'coach',
              id: coach.id,
              name: coach.full_name || coach.email,
              email: coach.email,
              roles: coach.roles,
              children: [],
            }

            // Add all clients that this coach has access to
            matrix.forEach(client => {
              const coachHasAccess = client.assigned_users.some(
                u => u.user_id === coach.id,
              )
              if (coachHasAccess) {
                const accessInfo = client.assigned_users.find(
                  u => u.user_id === coach.id,
                )
                coachNode.children.push({
                  type: 'client',
                  id: client.client_id,
                  name: client.client_name,
                  access_level: accessInfo?.access_level,
                  is_owner: accessInfo?.is_owner,
                  children: [],
                })
              }
            })

            if (coachNode.children.length > 0) {
              adminNode.children.push(coachNode)
            }
          })

          // Also add any direct client access grants (not via coach)
          matrix.forEach(client => {
            const adminHasDirectAccess = client.assigned_users.some(
              u => u.user_id === admin.id,
            )
            if (adminHasDirectAccess) {
              // Check if this client is already under a coach node
              const alreadyInHierarchy = adminNode.children.some(coachNode =>
                coachNode.children.some(
                  clientNode => clientNode.id === client.client_id,
                ),
              )

              if (!alreadyInHierarchy) {
                const accessInfo = client.assigned_users.find(
                  u => u.user_id === admin.id,
                )
                adminNode.children.push({
                  type: 'client',
                  id: client.client_id,
                  name: client.client_name,
                  access_level: accessInfo?.access_level,
                  is_owner: accessInfo?.is_owner,
                  children: [],
                })
              }
            }
          })
        }

        if (adminNode.children.length > 0) {
          hierarchy.push(adminNode)
        }
      })

      // Add standalone coaches (not under any admin) with their clients
      coaches.forEach(coach => {
        // Check if this coach is already in hierarchy under an admin
        const existsInHierarchy = hierarchy.some(admin =>
          admin.children.some(c => c.id === coach.id),
        )

        if (existsInHierarchy) return

        const coachNode: HierarchyNode = {
          type: 'coach',
          id: coach.id,
          name: coach.full_name || coach.email,
          email: coach.email,
          roles: coach.roles,
          children: [],
        }

        matrix.forEach(client => {
          const coachHasAccess = client.assigned_users.some(
            u => u.user_id === coach.id,
          )
          if (coachHasAccess) {
            const accessInfo = client.assigned_users.find(
              u => u.user_id === coach.id,
            )
            coachNode.children.push({
              type: 'client',
              id: client.client_id,
              name: client.client_name,
              access_level: accessInfo?.access_level,
              is_owner: accessInfo?.is_owner,
              children: [],
            })
          }
        })

        if (coachNode.children.length > 0) {
          hierarchy.push(coachNode)
        }
      })

      return hierarchy
    },
    [],
  )

  // Build hierarchy with memoization - only recalculate when data changes
  const hierarchyData = useMemo(() => {
    if (accessMatrix.length === 0 || users.length === 0) return []
    return buildHierarchy(accessMatrix, users, coachAccessList)
  }, [accessMatrix, users, coachAccessList, buildHierarchy])

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
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
          <div className={`p-2 rounded-lg ${getNodeColor(node.type)}`}>
            {getNodeIcon(node.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{node.name}</span>
              {node.email && (
                <span className="text-xs text-muted-foreground">
                  ({node.email})
                </span>
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
              {node.is_owner && (
                <Badge variant="secondary" className="text-xs">
                  Owner
                </Badge>
              )}
              {node.access_level && !node.is_owner && (
                <Badge
                  variant="outline"
                  className={
                    node.access_level === 'full' ? 'text-xs' : 'text-xs'
                  }
                >
                  {node.access_level === 'full' ? 'Full Access' : 'Read Only'}
                </Badge>
              )}
            </div>
            {node.type === 'client' && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Client Account
              </p>
            )}
          </div>
          {node.children.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Network className="h-3 w-3" />
              <span>{node.children.length}</span>
            </div>
          )}
        </div>
        {node.children.length > 0 && (
          <div className="ml-4 border-l-2 border-border pl-4 mt-2">
            {node.children.map(child => renderHierarchyNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Hierarchy</CardTitle>
          <CardDescription>
            Visual representation of admin → coach → client relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Access Hierarchy</CardTitle>
            <CardDescription>
              Visual representation of admin → coach → client relationships
            </CardDescription>
          </div>
          {isFetching && (
            <Badge variant="secondary" className="text-xs">
              Updating...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hierarchyData.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No hierarchy data available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Access relationships will appear here once configured
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {hierarchyData.map(node => renderHierarchyNode(node))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
