'use client'

import { useState, useEffect } from 'react'
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
  Monitor
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/contexts/permission-context'

interface AuditLogEntry {
  id: string
  user_id: string
  user_email: string
  user_name: string
  resource_type: string
  resource_id: string | null
  action: string
  details: any
  ip_address: string | null
  user_agent: string | null
  timestamp: string
}

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
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [resourceFilter, setResourceFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('7days')
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [stats, setStats] = useState({
    totalActions: 0,
    uniqueUsers: 0,
    viewActions: 0,
    editActions: 0,
  })
  
  const { toast } = useToast()
  const _permissions = usePermissions()

  useEffect(() => {
    fetchAuditLogs()
  }, [resourceFilter, actionFilter, dateFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      
      // TODO: Fetch actual audit logs from API
      // For now, create mock data
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          user_id: 'user1',
          user_email: 'admin@example.com',
          user_name: 'Admin User',
          resource_type: 'client',
          resource_id: 'client123',
          action: 'view',
          details: { client_name: 'John Doe' },
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0...',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'user2',
          user_email: 'coach@example.com',
          user_name: 'Coach User',
          resource_type: 'transcript',
          resource_id: 'transcript456',
          action: 'view',
          details: { session_id: 'session789' },
          ip_address: '192.168.1.2',
          user_agent: 'Chrome/120.0...',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          user_id: 'user1',
          user_email: 'admin@example.com',
          user_name: 'Admin User',
          resource_type: 'coach_access',
          resource_id: 'access789',
          action: 'grant',
          details: { 
            coach_id: 'coach123',
            admin_id: 'admin456',
            coach_name: 'John Coach',
            admin_name: 'Jane Admin'
          },
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0...',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ]
      
      setLogs(mockLogs)
      
      // Calculate stats
      const uniqueUsers = new Set(mockLogs.map(l => l.user_id)).size
      const viewActions = mockLogs.filter(l => l.action === 'view').length
      const editActions = mockLogs.filter(l => l.action === 'edit').length
      
      setStats({
        totalActions: mockLogs.length,
        uniqueUsers,
        viewActions,
        editActions,
      })
      
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      // TODO: Implement export functionality
      toast({
        title: 'Export Started',
        description: 'Audit log export has been initiated',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to export audit logs',
        variant: 'destructive'
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
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
        minute: '2-digit'
      })
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    
    return matchesSearch && matchesResource && matchesAction
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Audit Log
          </h1>
          <p className="text-gray-500 mt-2">Track all system access and modifications</p>
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
              <CardTitle className="text-sm font-medium text-gray-600">Total Actions</CardTitle>
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
              <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
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
              <CardTitle className="text-sm font-medium text-gray-600">View Actions</CardTitle>
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
              <CardTitle className="text-sm font-medium text-gray-600">Modifications</CardTitle>
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
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
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{log.user_name}</p>
                        <p className="text-xs text-gray-500">{log.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getResourceIcon(log.resource_type)}
                        <span className="text-sm capitalize">{log.resource_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge variant={getActionBadgeVariant(log.action)} className="capitalize">
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
                  <label className="text-sm font-medium text-gray-500">User</label>
                  <p className="text-sm font-medium">{selectedLog.user_name}</p>
                  <p className="text-xs text-gray-500">{selectedLog.user_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Timestamp</label>
                  <p className="text-sm">
                    {new Date(selectedLog.timestamp).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'medium'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Resource</label>
                  <p className="text-sm capitalize">{selectedLog.resource_type}</p>
                  {selectedLog.resource_id && (
                    <p className="text-xs text-gray-500 font-mono">{selectedLog.resource_id}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Action</label>
                  <Badge variant={getActionBadgeVariant(selectedLog.action)} className="capitalize mt-1">
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">IP Address</label>
                  <p className="text-sm font-mono">{selectedLog.ip_address || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">User Agent</label>
                  <p className="text-xs text-gray-600 truncate">
                    {selectedLog.user_agent || 'Unknown'}
                  </p>
                </div>
              </div>
              
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Additional Details</label>
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