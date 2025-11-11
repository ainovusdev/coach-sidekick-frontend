'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Shield,
  UserCheck,
  User,
  Network,
  Building,
  ChevronDown,
  ChevronRight,
  Search,
  MoreVertical,
  Eye,
  Link2,
  Filter,
  X,
} from 'lucide-react'
import { ClientAccessMatrix, User as UserType } from '@/services/admin-service'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<
    'all' | 'admin' | 'coach' | 'client'
  >('all')

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

            // Always show coaches under super admin, even without clients
            adminNode.children.push(coachNode)
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

            // Always show assigned coaches under admin, even without clients
            adminNode.children.push(coachNode)
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

        // Always show coaches, even if they have no clients yet
        hierarchy.push(coachNode)
      })

      return hierarchy
    },
    [],
  )

  // Build hierarchy with memoization
  const hierarchyData = useMemo(() => {
    if (accessMatrix.length === 0 || users.length === 0) return []
    return buildHierarchy(accessMatrix, users, coachAccessList)
  }, [accessMatrix, users, coachAccessList, buildHierarchy])

  // Filter and search hierarchy
  const filteredHierarchy = useMemo(() => {
    if (!searchQuery && typeFilter === 'all') return hierarchyData

    const filterNode = (node: HierarchyNode): HierarchyNode | null => {
      // Check if current node matches search
      const matchesSearch =
        !searchQuery ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.email?.toLowerCase().includes(searchQuery.toLowerCase())

      // Check if current node matches type filter
      const matchesType = typeFilter === 'all' || node.type === typeFilter

      // Recursively filter children
      const filteredChildren = node.children
        .map(child => filterNode(child))
        .filter((child): child is HierarchyNode => child !== null)

      // Include node if it matches or has matching children
      if ((matchesSearch && matchesType) || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        }
      }

      return null
    }

    return hierarchyData
      .map(node => filterNode(node))
      .filter((node): node is HierarchyNode => node !== null)
  }, [hierarchyData, searchQuery, typeFilter])

  // Auto-expand nodes when searching/filtering to show matches
  useMemo(() => {
    if (!searchQuery && typeFilter === 'all') return

    // Collect all node IDs that should be expanded to show matches
    const nodesToExpand = new Set<string>()

    const collectExpandableNodes = (
      node: HierarchyNode,
      ancestors: string[] = [],
    ) => {
      const matchesSearch =
        !searchQuery ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.email?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = typeFilter === 'all' || node.type === typeFilter

      // If this node matches, expand all ancestors AND the node itself (to show its children)
      if (matchesSearch && matchesType) {
        ancestors.forEach(ancestorId => nodesToExpand.add(ancestorId))
        // Also expand this matching node if it has children
        if (node.children.length > 0) {
          nodesToExpand.add(node.id)
        }
      }

      // Recursively check children
      node.children.forEach(child => {
        collectExpandableNodes(child, [...ancestors, node.id])
      })
    }

    filteredHierarchy.forEach(node => collectExpandableNodes(node))
    setExpandedNodes(nodesToExpand)
  }, [searchQuery, typeFilter, filteredHierarchy])

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  // Expand all nodes
  const expandAll = () => {
    const allNodeIds = new Set<string>()
    const collectIds = (node: HierarchyNode) => {
      allNodeIds.add(node.id)
      node.children.forEach(collectIds)
    }
    hierarchyData.forEach(collectIds)
    setExpandedNodes(allNodeIds)
  }

  // Collapse all nodes
  const collapseAll = () => {
    setExpandedNodes(new Set())
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

  // Quick actions handler
  const handleViewDetails = (node: HierarchyNode) => {
    if (node.type === 'admin' || node.type === 'coach') {
      router.push(`/admin/users?user=${node.id}`)
    } else if (node.type === 'client') {
      router.push(`/clients/${node.id}`)
    }
  }

  const handleManageAccess = (node: HierarchyNode) => {
    if (node.type === 'coach') {
      // Switch to coach delegation tab
      router.push('/admin/access?tab=coach-delegation')
    } else if (node.type === 'client') {
      // Switch to client access tab
      router.push('/admin/access?tab=client-access')
    }
  }

  const renderHierarchyNode = (node: HierarchyNode, level: number = 0) => {
    const isSuper = node.roles?.includes('super_admin')
    const hasChildren = node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const nodeKey = `${node.type}-${node.id}`

    // Highlight if matches search
    const matchesSearch =
      searchQuery &&
      (node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.email?.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
      <div key={nodeKey} className={`${level > 0 ? 'ml-8' : ''}`}>
        <div
          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
            matchesSearch
              ? 'bg-yellow-50 border-2 border-yellow-300'
              : 'hover:bg-muted/50 border-2 border-transparent'
          }`}
        >
          {/* Expand/Collapse button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleNode(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Icon */}
          <div className={`p-2 rounded-lg ${getNodeColor(node.type)}`}>
            {getNodeIcon(node.type)}
          </div>

          {/* Node Info */}
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
                <Badge variant="outline" className="text-xs">
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

          {/* Children count */}
          {hasChildren && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Network className="h-3 w-3" />
              <span>{node.children.length}</span>
            </div>
          )}

          {/* Quick Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewDetails(node)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {(node.type === 'coach' || node.type === 'client') && (
                <DropdownMenuItem onClick={() => handleManageAccess(node)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Manage Access
                </DropdownMenuItem>
              )}
              {hasChildren && (
                <>
                  <DropdownMenuItem onClick={() => toggleNode(node.id)}>
                    {isExpanded ? (
                      <>
                        <ChevronRight className="h-4 w-4 mr-2" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Expand
                      </>
                    )}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children (only show if expanded) */}
        {hasChildren && isExpanded && (
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

        {/* Search and Filter Controls */}
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {typeFilter === 'all'
                  ? 'All Types'
                  : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('admin')}>
                <Shield className="h-4 w-4 mr-2" />
                Admins
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('coach')}>
                <UserCheck className="h-4 w-4 mr-2" />
                Coaches
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('client')}>
                <User className="h-4 w-4 mr-2" />
                Clients
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Expand/Collapse All */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredHierarchy.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery || typeFilter !== 'all'
                ? 'No matches found'
                : 'No hierarchy data available'}
            </p>
            {(searchQuery || typeFilter !== 'all') && (
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setTypeFilter('all')
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHierarchy.map(node => renderHierarchyNode(node))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
