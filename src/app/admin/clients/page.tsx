'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AdminClient } from '@/types/admin-client'
import {
  useAdminClients,
  useAdminClientStats,
} from '@/hooks/queries/use-admin-clients'
import { useAdminUsers } from '@/hooks/queries/use-admin-users'
import {
  useDeleteAdminClient,
  useBulkAssignCoach,
  useBulkAssignProgram,
  useExportClients,
} from '@/hooks/mutations/use-admin-client-mutations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  MoreVertical,
  Users,
  UserCheck,
  Calendar,
  Download,
  Upload,
  Trash2,
  Edit,
  UserCog,
  FolderPlus,
  X,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import axiosInstance from '@/lib/axios-config'
import { formatDate } from '@/lib/date-utils'

interface Program {
  id: string
  name: string
  color: string
}

export default function AdminClientsPage() {
  const searchParams = useSearchParams()
  const initialProgramId = searchParams.get('program_id') || 'all'

  // Filter state - initialize from URL params
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCoach, setSelectedCoach] = useState<string>('all')
  const [selectedProgram, setSelectedProgram] =
    useState<string>(initialProgramId)

  // Selection state
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())

  // Dialog state
  const [isAssignCoachDialogOpen, setIsAssignCoachDialogOpen] = useState(false)
  const [isAssignProgramDialogOpen, setIsAssignProgramDialogOpen] =
    useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<AdminClient | null>(null)

  // Bulk action form state
  const [bulkCoachId, setBulkCoachId] = useState<string>('')
  const [bulkProgramId, setBulkProgramId] = useState<string>('')
  const [bulkProgramAction, setBulkProgramAction] = useState<'add' | 'remove'>(
    'add',
  )

  // Query hooks
  const { data: clientsData, isLoading: loadingClients } = useAdminClients({
    limit: 100,
    search: searchQuery || undefined,
    coach_id: selectedCoach !== 'all' ? selectedCoach : undefined,
    program_id: selectedProgram !== 'all' ? selectedProgram : undefined,
  })
  const clients = clientsData?.clients || []

  const { data: stats, isLoading: loadingStats } = useAdminClientStats()

  const { data: users = [] } = useAdminUsers({ limit: 100 })
  const coaches = users.filter(
    u =>
      u.roles.includes('coach') ||
      u.roles.includes('admin') ||
      u.roles.includes('super_admin'),
  )

  // Fetch programs
  const { data: programsData } = useQuery<{ programs: Program[] }>({
    queryKey: queryKeys.programs.list(),
    queryFn: async () => {
      const response = await axiosInstance.get('/programs')
      return response.data
    },
  })
  const programs = programsData?.programs || []

  // Mutation hooks
  const { mutate: deleteClient, isPending: isDeleting } = useDeleteAdminClient()
  const { mutate: bulkAssignCoach, isPending: isAssigningCoach } =
    useBulkAssignCoach()
  const { mutate: bulkAssignProgram, isPending: isAssigningProgram } =
    useBulkAssignProgram()
  const { mutate: exportClients, isPending: isExporting } = useExportClients()

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(new Set(clients.map(c => c.id)))
    } else {
      setSelectedClients(new Set())
    }
  }

  const handleSelectClient = (clientId: string, checked: boolean) => {
    const newSelected = new Set(selectedClients)
    if (checked) {
      newSelected.add(clientId)
    } else {
      newSelected.delete(clientId)
    }
    setSelectedClients(newSelected)
  }

  const clearSelection = () => {
    setSelectedClients(new Set())
  }

  // Bulk action handlers
  const handleBulkAssignCoach = () => {
    if (!bulkCoachId || selectedClients.size === 0) return

    bulkAssignCoach(
      {
        client_ids: Array.from(selectedClients),
        coach_id: bulkCoachId,
      },
      {
        onSuccess: () => {
          setIsAssignCoachDialogOpen(false)
          setBulkCoachId('')
          clearSelection()
        },
      },
    )
  }

  const handleBulkAssignProgram = () => {
    if (!bulkProgramId || selectedClients.size === 0) return

    bulkAssignProgram(
      {
        client_ids: Array.from(selectedClients),
        program_id: bulkProgramId,
        action: bulkProgramAction,
      },
      {
        onSuccess: () => {
          setIsAssignProgramDialogOpen(false)
          setBulkProgramId('')
          clearSelection()
        },
      },
    )
  }

  const handleDeleteClient = () => {
    if (!clientToDelete) return

    deleteClient(clientToDelete.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setClientToDelete(null)
      },
    })
  }

  const handleExport = () => {
    exportClients({
      search: searchQuery || undefined,
      coach_id: selectedCoach !== 'all' ? selectedCoach : undefined,
      program_id: selectedProgram !== 'all' ? selectedProgram : undefined,
    })
  }

  const openDeleteDialog = (client: AdminClient) => {
    setClientToDelete(client)
    setIsDeleteDialogOpen(true)
  }

  const formatDateValue = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return formatDate(dateString)
  }

  const isAllSelected =
    clients.length > 0 && selectedClients.size === clients.length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Client Management
            </h1>
            <p className="text-gray-500 mt-2">
              View and manage all clients across the organization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/clients/import">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Clients
                </CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.total_clients || 0}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  With Portal Access
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {stats?.total_with_portal_access || 0}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Sessions
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.total_sessions || 0}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Coaches
                </CardTitle>
                <UserCheck className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.by_coach?.length || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCoach} onValueChange={setSelectedCoach}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Coaches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Coaches</SelectItem>
                {coaches.map(coach => (
                  <SelectItem key={coach.id} value={coach.id}>
                    {coach.full_name || coach.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Sandboxes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sandboxes</SelectItem>
                {programs.map(program => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchQuery ||
              selectedCoach !== 'all' ||
              selectedProgram !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCoach('all')
                  setSelectedProgram('all')
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Bulk Action Bar */}
      {selectedClients.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-700">
                  {selectedClients.size} client(s) selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-blue-700 hover:text-blue-900"
                >
                  Clear selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignCoachDialogOpen(true)}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Assign Coach
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignProgramDialogOpen(true)}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Manage Sandbox
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          {loadingClients ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No clients found</p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Coach</TableHead>
                  <TableHead>Sandboxes</TableHead>
                  <TableHead className="text-center">Sessions</TableHead>
                  <TableHead className="text-center">Portal</TableHead>
                  <TableHead>Last Session</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map(client => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedClients.has(client.id)}
                        onCheckedChange={checked =>
                          handleSelectClient(client.id, !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        {client.email && (
                          <div className="text-sm text-gray-500">
                            {client.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {client.coach_name || 'Unknown'}
                        </div>
                        <div className="text-gray-500">
                          {client.coach_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {client.programs.length === 0 ? (
                          <span className="text-gray-400 text-sm">None</span>
                        ) : (
                          client.programs.slice(0, 2).map(program => (
                            <Badge
                              key={program.id}
                              variant="secondary"
                              style={{
                                backgroundColor: `${program.color}20`,
                                color: program.color,
                                borderColor: program.color,
                              }}
                              className="text-xs"
                            >
                              {program.name}
                            </Badge>
                          ))
                        )}
                        {client.programs.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{client.programs.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">
                        {client.total_sessions}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {client.has_portal_access ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDateValue(client.last_session_date)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/clients/${client.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              View Client
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(client)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination info */}
      {clientsData && (
        <div className="text-sm text-gray-500 text-center">
          Showing {clients.length} of {clientsData.total} clients
        </div>
      )}

      {/* Assign Coach Dialog */}
      <Dialog
        open={isAssignCoachDialogOpen}
        onOpenChange={setIsAssignCoachDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Coach</DialogTitle>
            <DialogDescription>
              Assign {selectedClients.size} selected client(s) to a coach
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={bulkCoachId} onValueChange={setBulkCoachId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a coach" />
              </SelectTrigger>
              <SelectContent>
                {coaches.map(coach => (
                  <SelectItem key={coach.id} value={coach.id}>
                    {coach.full_name || coach.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignCoachDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssignCoach}
              disabled={!bulkCoachId || isAssigningCoach}
            >
              {isAssigningCoach ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Assign Coach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Program Dialog */}
      <Dialog
        open={isAssignProgramDialogOpen}
        onOpenChange={setIsAssignProgramDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Sandbox Membership</DialogTitle>
            <DialogDescription>
              Add or remove {selectedClients.size} selected client(s) from a
              sandbox
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex gap-2">
              <Button
                variant={bulkProgramAction === 'add' ? 'default' : 'outline'}
                onClick={() => setBulkProgramAction('add')}
                className="flex-1"
              >
                Add to Sandbox
              </Button>
              <Button
                variant={bulkProgramAction === 'remove' ? 'default' : 'outline'}
                onClick={() => setBulkProgramAction('remove')}
                className="flex-1"
              >
                Remove from Sandbox
              </Button>
            </div>
            <Select value={bulkProgramId} onValueChange={setBulkProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a sandbox" />
              </SelectTrigger>
              <SelectContent>
                {programs.map(program => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignProgramDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssignProgram}
              disabled={!bulkProgramId || isAssigningProgram}
            >
              {isAssigningProgram ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {bulkProgramAction === 'add'
                ? 'Add to Sandbox'
                : 'Remove from Sandbox'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>{clientToDelete?.name}</strong>? This will also delete all
              associated sessions, transcripts, and other data. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClient}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
