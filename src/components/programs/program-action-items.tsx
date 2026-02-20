'use client'

import { useState, useMemo } from 'react'
import { useProgramActionItems } from '@/hooks/queries/use-programs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react'
import { formatRelativeTime } from '@/lib/date-utils'

interface ProgramActionItemsProps {
  programId: string
}

export function ProgramActionItems({ programId }: ProgramActionItemsProps) {
  const [statusFilter, setStatusFilter] = useState<
    'pending' | 'completed' | 'overdue' | undefined
  >(undefined)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [selectedCoaches, setSelectedCoaches] = useState<string[]>([])
  const { data: actionItems, isLoading } = useProgramActionItems(
    programId,
    statusFilter,
  )

  // Get unique clients and coaches for filtering
  const { uniqueClients, uniqueCoaches } = useMemo(() => {
    if (!actionItems) return { uniqueClients: [], uniqueCoaches: [] }

    const clientsMap = new Map<string, string>()
    const coachesMap = new Map<string, string>()

    actionItems.action_items.forEach(item => {
      clientsMap.set(item.client_id, item.client_name)
      if (item.coach_id && item.coach_name) {
        coachesMap.set(item.coach_id, item.coach_name)
      }
    })

    return {
      uniqueClients: Array.from(clientsMap, ([id, name]) => ({
        id,
        name,
      })).sort((a, b) => a.name.localeCompare(b.name)),
      uniqueCoaches: Array.from(coachesMap, ([id, name]) => ({
        id,
        name,
      })).sort((a, b) => a.name.localeCompare(b.name)),
    }
  }, [actionItems])

  // Filter action items based on selected filters
  const filteredActionItems = useMemo(() => {
    if (!actionItems) return []

    return actionItems.action_items.filter(item => {
      const clientMatch =
        selectedClients.length === 0 || selectedClients.includes(item.client_id)
      const coachMatch =
        selectedCoaches.length === 0 || selectedCoaches.includes(item.coach_id)
      return clientMatch && coachMatch
    })
  }, [actionItems, selectedClients, selectedCoaches])

  const toggleClientFilter = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId],
    )
  }

  const toggleCoachFilter = (coachId: string) => {
    setSelectedCoaches(prev =>
      prev.includes(coachId)
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId],
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!actionItems) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-gray-600">No action items available</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Action Items</h2>
          <p className="text-gray-600 mt-1">
            Track commitments and follow-ups across all clients
          </p>
        </div>
        <Select
          value={statusFilter || 'all'}
          onValueChange={value =>
            setStatusFilter(value === 'all' ? undefined : (value as any))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Items
            </CardTitle>
            <ListTodo className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {actionItems.total_action_items}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {actionItems.pending_count}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {actionItems.completed_count}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overdue
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {actionItems.overdue_count}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {actionItems.completion_rate.toFixed(0)}% completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter action items by client or coach
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client Filters */}
          {uniqueClients.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Clients</p>
              <div className="flex flex-wrap gap-2">
                {uniqueClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => toggleClientFilter(client.id)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      selectedClients.includes(client.id)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                    }`}
                  >
                    {client.name}
                  </button>
                ))}
                {selectedClients.length > 0 && (
                  <button
                    onClick={() => setSelectedClients([])}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Coach Filters */}
          {uniqueCoaches.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Coaches</p>
              <div className="flex flex-wrap gap-2">
                {uniqueCoaches.map(coach => (
                  <button
                    key={coach.id}
                    onClick={() => toggleCoachFilter(coach.id)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      selectedCoaches.includes(coach.id)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                    }`}
                  >
                    {coach.name}
                  </button>
                ))}
                {selectedCoaches.length > 0 && (
                  <button
                    onClick={() => setSelectedCoaches([])}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Items List */}
      <Card>
        <CardHeader>
          <CardTitle>All Action Items</CardTitle>
          <CardDescription>
            Showing {filteredActionItems.length}{' '}
            {statusFilter ? statusFilter : 'total'} action items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredActionItems.length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No action items found</p>
              {(statusFilter ||
                selectedClients.length > 0 ||
                selectedCoaches.length > 0) && (
                <p className="text-sm text-gray-500 mt-2">
                  Try changing the filters
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActionItems.map(item => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={`flex items-center gap-1 ${getStatusColor(item.status)}`}
                          variant="outline"
                        >
                          {getStatusIcon(item.status)}
                          {item.status}
                        </Badge>
                        {item.due_date && (
                          <span className="text-xs text-gray-500">
                            Due {formatRelativeTime(item.due_date)}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 font-medium">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>Client: {item.client_name}</span>
                        <span>•</span>
                        <span>Coach: {item.coach_name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(item.session_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
