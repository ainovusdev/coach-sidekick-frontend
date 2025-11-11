'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAuditLog } from '@/hooks/queries/use-admin-audit-log'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Download,
  Search,
  Clock,
  User,
  Shield,
  Eye,
  Edit,
  Trash2,
  Database,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Monitor,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/contexts/permission-context'

import { AuditLogEntry } from '@/services/admin-service'

const RESOURCE_TYPES = [
  { value: 'all', label: 'All Resources' },
  { value: 'client', label: 'Client' },
  { value: 'session', label: 'Session' },
  { value: 'transcript', label: 'Transcript' },
  { value: 'insights', label: 'Insights' },
  { value: 'user', label: 'User' },
  { value: 'coach', label: 'Coach' },
  { value: 'coach_access', label: 'Coach Access' },
  { value: 'client_access', label: 'Client Access' },
]

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'view', label: 'View' },
  { value: 'create', label: 'Create' },
  { value: 'edit', label: 'Edit' },
  { value: 'delete', label: 'Delete' },
  { value: 'export', label: 'Export' },
  { value: 'grant', label: 'Grant Access' },
  { value: 'revoke', label: 'Revoke Access' },
  { value: 'generate', label: 'Generate' },
]

export default function AuditLogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [resourceFilter, setResourceFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('7days')
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  const { toast } = useToast()
  const _permissions = usePermissions()

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const now = new Date()
    let startDate: Date | null = null

    switch (dateFilter) {
      case '24hours':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        startDate = null
        break
    }

    return {
      start_date: startDate?.toISOString(),
      end_date: startDate ? now.toISOString() : undefined,
    }
  }, [dateFilter])

  // React Query hook - fetch real audit logs!
  const {
    data: logs = [],
    isLoading: loading,
    error,
  } = useAuditLog({
    limit: 500,
    resource_type: resourceFilter === 'all' ? undefined : resourceFilter,
    action: actionFilter === 'all' ? undefined : actionFilter,
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
  })

  // Show error toast if query fails - use useEffect to avoid infinite loop
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      })
    }
  }, [error, toast])

  // Calculate stats with memoization
  const stats = useMemo(() => {
    const uniqueUsers = new Set(logs.map(l => l.user_id)).size
    const viewActions = logs.filter(l => l.action === 'view').length
    const editActions = logs.filter(
      l =>
        l.action === 'edit' || l.action === 'create' || l.action === 'delete',
    ).length

    return {
      totalActions: logs.length,
      uniqueUsers,
      viewActions,
      editActions,
    }
  }, [logs])

  const handleExport = async () => {
    try {
      // Convert logs to CSV
      const headers = [
        'Timestamp',
        'User Name',
        'User Email',
        'Action',
        'Resource Type',
        'Resource ID',
        'IP Address',
        'User Agent',
      ]

      const csvRows = [
        headers.join(','),
        ...filteredLogs.map(log =>
          [
            new Date(log.created_at).toLocaleString(),
            `"${log.user_name || ''}"`,
            log.user_email,
            log.action,
            log.resource_type,
            log.resource_id || '',
            log.ip_address || '',
            `"${log.user_agent || ''}"`,
          ].join(','),
        ),
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `audit-logs-${new Date().toISOString().split('T')[0]}.csv`,
      )
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Export Complete',
        description: `Exported ${filteredLogs.length} audit log entries`,
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to export audit logs',
        variant: 'destructive',
      })
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'view':
        return <Eye className="h-4 w-4 text-blue-500" />
      case 'edit':
        return <Edit className="h-4 w-4 text-yellow-500" />
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />
      case 'create':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'grant':
        return <Shield className="h-4 w-4 text-purple-500" />
      case 'revoke':
        return <XCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionBadgeVariant = (action: string): any => {
    switch (action) {
      case 'view':
        return 'secondary'
      case 'edit':
        return 'outline'
      case 'delete':
        return 'destructive'
      case 'create':
        return 'default'
      case 'grant':
        return 'default'
      case 'revoke':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'client':
        return <User className="h-4 w-4" />
      case 'transcript':
        return <FileText className="h-4 w-4" />
      case 'coach':
        return <Shield className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  const formatTimestamp = (createdAt: string) => {
    const date = new Date(createdAt)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)

    if (hours < 1) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  // Client-side search filtering (resource and action filters are server-side)
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (searchQuery === '') return true

      const searchLower = searchQuery.toLowerCase()
      return (
        log.user_email?.toLowerCase().includes(searchLower) ||
        log.user_name?.toLowerCase().includes(searchLower) ||
        log.action?.toLowerCase().includes(searchLower) ||
        log.resource_type?.toLowerCase().includes(searchLower)
      )
    })
  }, [logs, searchQuery])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Audit Log
          </h1>
          <p className="text-gray-500 mt-2">
            Track all system access and modifications
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Actions
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActions}</div>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Users
              </CardTitle>
              <User className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Unique users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                View Actions
              </CardTitle>
              <Eye className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.viewActions}</div>
            <p className="text-xs text-gray-500 mt-1">Read operations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Modifications
              </CardTitle>
              <Edit className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.editActions}</div>
            <p className="text-xs text-gray-500 mt-1">Write operations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user or action..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24hours">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map(log => (
                  <TableRow key={log.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {formatTimestamp(log.created_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{log.user_name}</p>
                        <p className="text-xs text-gray-500">
                          {log.user_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getResourceIcon(log.resource_type)}
                        <span className="text-sm capitalize">
                          {log.resource_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge
                          variant={getActionBadgeVariant(log.action)}
                          className="capitalize"
                        >
                          {log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Monitor className="h-3 w-3" />
                        {log.ip_address || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log)
                          setIsDetailsDialogOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this system action
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    User
                  </label>
                  <p className="text-sm font-medium">{selectedLog.user_name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedLog.user_email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Timestamp
                  </label>
                  <p className="text-sm">
                    {new Date(selectedLog.created_at).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Resource
                  </label>
                  <p className="text-sm capitalize">
                    {selectedLog.resource_type}
                  </p>
                  {selectedLog.resource_id && (
                    <p className="text-xs text-gray-500 font-mono">
                      {selectedLog.resource_id}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Action
                  </label>
                  <Badge
                    variant={getActionBadgeVariant(selectedLog.action)}
                    className="capitalize mt-1"
                  >
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    IP Address
                  </label>
                  <p className="text-sm font-mono">
                    {selectedLog.ip_address || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    User Agent
                  </label>
                  <p className="text-xs text-gray-600 truncate">
                    {selectedLog.user_agent || 'Unknown'}
                  </p>
                </div>
              </div>

              {selectedLog.details &&
                Object.keys(selectedLog.details).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Additional Details
                    </label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
