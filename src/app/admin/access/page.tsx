'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Network, Lock, List, Loader2 } from 'lucide-react'
import { useAdminUsers } from '@/hooks/queries/use-admin-users'
import { useAccessMatrix } from '@/hooks/queries/use-admin-access'
import { useCoachAccessList } from '@/hooks/queries/use-admin-coach-access'
import HierarchyView from './components/hierarchy-view'
import CoachDelegationView from './components/coach-delegation-view'
import ClientAccessView from './components/client-access-view'
import ListView from './components/list-view'

export default function UnifiedAccessManagementPage() {
  const [activeTab, setActiveTab] = useState('hierarchy')

  // Fetch all data with TanStack Query
  const {
    data: users = [],
    isLoading: usersLoading,
    isFetching: usersFetching,
  } = useAdminUsers({ limit: 1000 })
  const {
    data: accessMatrix = [],
    isLoading: accessLoading,
    isFetching: accessFetching,
  } = useAccessMatrix({ limit: 100 })
  const {
    data: coachAccessList = [],
    isLoading: coachAccessLoading,
    isFetching: coachAccessFetching,
  } = useCoachAccessList()

  const isInitialLoading = usersLoading || accessLoading || coachAccessLoading
  const isFetching = usersFetching || accessFetching || coachAccessFetching

  // Calculate stats
  const stats = useMemo(() => {
    if (isInitialLoading) return null

    const coaches = users.filter(u => u.roles.includes('coach'))
    const admins = users.filter(
      u => u.roles.includes('admin') || u.roles.includes('super_admin'),
    )
    const totalClients = accessMatrix.length
    const totalCoachDelegations = coachAccessList.length
    const totalClientGrants = accessMatrix.reduce(
      (sum, client) => sum + (client.assigned_users?.length || 0),
      0,
    )

    return {
      totalCoaches: coaches.length,
      totalAdmins: admins.length,
      totalClients,
      totalCoachDelegations,
      totalClientGrants,
    }
  }, [users, accessMatrix, coachAccessList, isInitialLoading])

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Access Management
          </h1>
          <p className="text-muted-foreground">
            Manage coach delegation and client access permissions
          </p>
        </div>
        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Refreshing...</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Admins
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAdmins}</div>
              <p className="text-xs text-muted-foreground">
                Admin & Super Admin users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Coaches
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCoaches}</div>
              <p className="text-xs text-muted-foreground">
                Active coach accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Clients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">Client profiles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Coach Delegations
              </CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalCoachDelegations}
              </div>
              <p className="text-xs text-muted-foreground">
                Admin → Coach assignments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Client Grants
              </CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalClientGrants}
              </div>
              <p className="text-xs text-muted-foreground">
                Individual client access
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hierarchy" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Hierarchy
          </TabsTrigger>
          <TabsTrigger
            value="coach-delegation"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Coach Delegation
          </TabsTrigger>
          <TabsTrigger
            value="client-access"
            className="flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Client Access
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy" className="space-y-4">
          <HierarchyView
            users={users}
            accessMatrix={accessMatrix}
            coachAccessList={coachAccessList}
            isLoading={isInitialLoading}
            isFetching={isFetching}
          />
        </TabsContent>

        <TabsContent value="coach-delegation" className="space-y-4">
          <CoachDelegationView
            users={users}
            coachAccessList={coachAccessList}
            isLoading={isInitialLoading}
            isFetching={isFetching}
          />
        </TabsContent>

        <TabsContent value="client-access" className="space-y-4">
          <ClientAccessView
            users={users}
            accessMatrix={accessMatrix}
            coachAccessList={coachAccessList}
            isLoading={isInitialLoading}
            isFetching={isFetching}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <ListView
            users={users}
            accessMatrix={accessMatrix}
            coachAccessList={coachAccessList}
            isLoading={isInitialLoading}
            isFetching={isFetching}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
