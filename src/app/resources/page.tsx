'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import PageLayout from '@/components/layout/page-layout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useResources } from '@/hooks/queries/use-resources'
import { useClientsSimple } from '@/hooks/queries/use-clients'
import {
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  useShareResource,
} from '@/hooks/mutations/use-resource-mutations'
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Globe,
  User,
  ClipboardList,
  Download,
  FolderOpen,
  AlertTriangle,
  Loader2,
  Trash2,
  Share2,
  X,
} from 'lucide-react'
import type { SharedResource } from '@/types/resource'
import { ResourceCard } from './components/resource-card'
import { CreateResourceDialog } from './components/create-resource-dialog'
import { EditResourceDialog } from './components/edit-resource-dialog'
import { ResourceDetailDialog } from './components/resource-detail-dialog'
import { useResourceForm } from './hooks/use-resource-form'
import { cn } from '@/lib/utils'
import { ResourceChatButton } from '@/components/resources/resource-chat-button'

type ScopeFilter = 'all' | 'global' | 'personal' | 'session' | 'shared'

export default function CoachResourcesPage() {
  const { user } = useAuth()
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<SharedResource | null>(
    null,
  )
  const [viewingResource, setViewingResource] = useState<SharedResource | null>(
    null,
  )
  const [deleteResource, setDeleteResource] = useState<SharedResource | null>(
    null,
  )
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  // Share dialog state
  const [sharingResource, setSharingResource] = useState<SharedResource | null>(
    null,
  )
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(
    new Set(),
  )
  const [clientSearch, setClientSearch] = useState('')
  const [isSharing, setIsSharing] = useState(false)

  const {
    form,
    setField,
    resetForm,
    populateForEdit,
    buildFormData,
    buildUpdateData,
    fileInputRef,
  } = useResourceForm()

  // Single fetch — all resources including knowledge docs
  const { data: allData, isLoading, error, refetch } = useResources({})
  const { data: clientsData } = useClientsSimple()

  const createResource = useCreateResource()
  const updateResource = useUpdateResource()
  const deleteResourceMutation = useDeleteResource()
  const shareResource = useShareResource()

  const allResources = allData?.resources || []

  // Local filtering by scope and search
  const filteredResources = useMemo(() => {
    let result = allResources

    // Scope filter
    if (scopeFilter === 'global') {
      result = result.filter(r => r.sharing_scope === 'global')
    } else if (scopeFilter === 'personal') {
      result = result.filter(r => r.sharing_scope === 'personal')
    } else if (scopeFilter === 'session') {
      result = result.filter(r => r.sharing_scope === 'session')
    } else if (scopeFilter === 'shared') {
      result = result.filter(r => (r.shares?.length ?? 0) > 0)
    }

    // Search filter
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase()
      result = result.filter(
        r =>
          r.title.toLowerCase().includes(term) ||
          r.description?.toLowerCase().includes(term),
      )
    }

    return result
  }, [allResources, scopeFilter, debouncedSearch])

  const resources = filteredResources
  const total = filteredResources.length

  // Stat calculations
  const totalResources = allData?.total || 0
  const personalCount = allResources.filter(
    r => r.sharing_scope === 'personal',
  ).length
  const sharedCount = allResources.filter(
    r => (r.shares?.length ?? 0) > 0,
  ).length
  const totalDownloads = allResources.reduce(
    (sum, r) => sum + (r.download_count || 0),
    0,
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    const timeout = setTimeout(() => setDebouncedSearch(value), 300)
    return () => clearTimeout(timeout)
  }

  const handleCreate = async () => {
    const formData = buildFormData()
    const hasFile = formData.has('file')
    if (hasFile) setUploadProgress(0)
    try {
      await createResource.mutateAsync({
        formData,
        onProgress: hasFile ? setUploadProgress : undefined,
      })
      setCreateDialogOpen(false)
      resetForm()
    } finally {
      setUploadProgress(null)
    }
  }

  const handleEdit = (resource: SharedResource) => {
    populateForEdit(resource)
    setEditingResource(resource)
  }

  const handleSaveEdit = async () => {
    if (!editingResource) return
    await updateResource.mutateAsync({
      id: editingResource.id,
      data: buildUpdateData(),
    })
    setEditingResource(null)
    resetForm()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteResource) return
    await deleteResourceMutation.mutateAsync(deleteResource.id)
    setDeleteResource(null)
  }

  const allClients = clientsData?.clients || []

  // Exclude clients already shared with
  const alreadySharedIds = useMemo(() => {
    const ids = new Set<string>()
    sharingResource?.shares?.forEach(s => {
      if (s.shared_with_client_id) ids.add(s.shared_with_client_id)
    })
    return ids
  }, [sharingResource])

  const shareableClients = useMemo(
    () => allClients.filter((c: any) => !alreadySharedIds.has(c.id)),
    [allClients, alreadySharedIds],
  )

  const filteredShareClients = useMemo(() => {
    if (!clientSearch.trim()) return shareableClients
    const q = clientSearch.toLowerCase()
    return shareableClients.filter(
      (c: any) =>
        c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q),
    )
  }, [shareableClients, clientSearch])

  const selectedClients = useMemo(
    () => shareableClients.filter((c: any) => selectedClientIds.has(c.id)),
    [shareableClients, selectedClientIds],
  )

  const handleShareResource = (resource: SharedResource) => {
    setSharingResource(resource)
    setSelectedClientIds(new Set())
    setClientSearch('')
  }

  const toggleClient = (id: string) => {
    setSelectedClientIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllClients = () => {
    if (selectedClientIds.size === shareableClients.length) {
      setSelectedClientIds(new Set())
    } else {
      setSelectedClientIds(new Set(shareableClients.map((c: any) => c.id)))
    }
  }

  const handleShareConfirm = async () => {
    if (!sharingResource || selectedClientIds.size === 0) return
    setIsSharing(true)
    try {
      await Promise.all(
        Array.from(selectedClientIds).map(cId =>
          shareResource
            .mutateAsync({
              id: sharingResource.id,
              data: { shared_with_client_id: cId },
            })
            .catch(() => {}),
        ),
      )
    } finally {
      setIsSharing(false)
      setSharingResource(null)
      setSelectedClientIds(new Set())
      setClientSearch('')
    }
  }

  const scopeFilters: {
    label: string
    value: ScopeFilter
    icon: typeof Globe
  }[] = [
    { label: 'All', value: 'all', icon: BookOpen },
    { label: 'Global', value: 'global', icon: Globe },
    { label: 'Personal', value: 'personal', icon: User },
    { label: 'Session', value: 'session', icon: ClipboardList },
    { label: 'Shared', value: 'shared', icon: Share2 },
  ]

  const statCards = [
    {
      label: 'Total Resources',
      value: totalResources,
      icon: FolderOpen,
      color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Personal',
      value: personalCount,
      icon: User,
      color:
        'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    },
    {
      label: 'Shared',
      value: sharedCount,
      icon: Share2,
      color:
        'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Total Downloads',
      value: totalDownloads,
      icon: Download,
      color:
        'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    },
  ]

  if (isLoading && allResources.length === 0) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="size-12 mx-auto mb-4 text-red-600" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Failed to load resources
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Resources
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage and share resources with your clients
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-gray-300 dark:border-gray-600"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                resetForm()
                setCreateDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(stat => {
            const StatIcon = stat.icon
            return (
              <Card
                key={stat.label}
                className="border-gray-200 dark:border-gray-700"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <StatIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Scope Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {scopeFilters.map(filter => {
            const FilterIcon = filter.icon
            return (
              <button
                key={filter.value}
                onClick={() => setScopeFilter(filter.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  scopeFilter === filter.value
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <FilterIcon className="h-3.5 w-3.5" />
                {filter.label}
              </button>
            )
          })}
        </div>

        {/* Resource count */}
        {total > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {total} resource{total !== 1 ? 's' : ''}
          </p>
        )}

        {/* Resources List */}
        {resources.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Resources Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
                Start sharing resources with your clients. Upload documents,
                share links, or write articles.
              </p>
              <Button
                onClick={() => {
                  resetForm()
                  setCreateDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Resource
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
            {resources.map(resource => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={handleEdit}
                onDelete={r => setDeleteResource(r)}
                onView={r => setViewingResource(r)}
                onShare={handleShareResource}
                isOwner={resource.coach_id === user?.id}
                canShare={
                  resource.sharing_scope === 'global' ||
                  resource.coach_id === user?.id
                }
              />
            ))}
          </div>
        )}

        {/* Create Resource Dialog */}
        <CreateResourceDialog
          open={createDialogOpen}
          onOpenChange={open => {
            setCreateDialogOpen(open)
            if (!open) resetForm()
          }}
          form={form}
          setField={setField}
          fileInputRef={fileInputRef}
          onSubmit={handleCreate}
          isPending={createResource.isPending}
          uploadProgress={uploadProgress}
        />

        {/* Edit Resource Dialog */}
        <EditResourceDialog
          open={!!editingResource}
          onOpenChange={open => {
            if (!open) {
              setEditingResource(null)
              resetForm()
            }
          }}
          form={form}
          setField={setField}
          onSubmit={handleSaveEdit}
          isPending={updateResource.isPending}
        />

        {/* Resource Detail Dialog */}
        <ResourceDetailDialog
          resource={viewingResource}
          open={!!viewingResource}
          onOpenChange={open => {
            if (!open) setViewingResource(null)
          }}
          onEdit={handleEdit}
          onDelete={r => setDeleteResource(r)}
          onShare={handleShareResource}
          isOwner={viewingResource?.coach_id === user?.id}
          canShare={
            viewingResource?.sharing_scope === 'global' ||
            viewingResource?.coach_id === user?.id
          }
        />

        {/* Share Resource Dialog */}
        <Dialog
          open={!!sharingResource}
          onOpenChange={open => {
            if (!open) {
              setSharingResource(null)
              setSelectedClientIds(new Set())
              setClientSearch('')
            }
          }}
        >
          <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Share Resource</DialogTitle>
              <DialogDescription>
                Share &quot;{sharingResource?.title}&quot; with clients
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              {/* Selected client tags */}
              {selectedClients.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedClients.map((client: any) => (
                    <span
                      key={client.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    >
                      {client.name}
                      <button
                        type="button"
                        onClick={() => toggleClient(client.id)}
                        className="hover:bg-white/20 dark:hover:bg-black/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search + Select All */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    placeholder="Search clients..."
                    className="h-8 text-sm pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllClients}
                  className="h-8 text-xs whitespace-nowrap"
                >
                  {selectedClientIds.size === shareableClients.length &&
                  shareableClients.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>

              {/* Client list */}
              <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[300px]">
                {filteredShareClients.map((client: any) => {
                  const isSelected = selectedClientIds.has(client.id)
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => toggleClient(client.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                        isSelected
                          ? 'bg-gray-100 dark:bg-gray-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                          isSelected
                            ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                            : 'border-gray-300 dark:border-gray-500',
                        )}
                      >
                        {isSelected && (
                          <svg
                            className="h-2.5 w-2.5 text-white dark:text-gray-900"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {client.name}
                        </p>
                        {client.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {client.email}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
                {filteredShareClients.length === 0 && clientSearch.trim() && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No clients found
                  </p>
                )}
              </div>
            </div>

            {selectedClientIds.size > 0 && (
              <DialogFooter className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="outline"
                  onClick={() => setSelectedClientIds(new Set())}
                >
                  Clear
                </Button>
                <Button onClick={handleShareConfirm} disabled={isSharing}>
                  {isSharing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share with {selectedClientIds.size} client
                      {selectedClientIds.size > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation AlertDialog */}
        <AlertDialog
          open={!!deleteResource}
          onOpenChange={open => {
            if (!deleteResourceMutation.isPending && !open) {
              setDeleteResource(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <AlertDialogTitle>Delete Resource</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                Are you sure you want to delete{' '}
                <strong>&quot;{deleteResource?.title}&quot;</strong>? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteResourceMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={e => {
                  e.preventDefault()
                  handleDeleteConfirm()
                }}
                disabled={deleteResourceMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteResourceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Resource
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <ResourceChatButton />
    </PageLayout>
  )
}
