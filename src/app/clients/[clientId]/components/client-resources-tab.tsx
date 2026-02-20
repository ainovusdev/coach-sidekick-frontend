'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useResources } from '@/hooks/queries/use-resources'
import {
  useCreateResource,
  useDeleteResource,
} from '@/hooks/mutations/use-resource-mutations'
import {
  BookOpen,
  FileText,
  Video,
  Link2,
  Plus,
  Search,
  Eye,
  Globe,
  Users,
  ClipboardList,
  Dumbbell,
  FileEdit,
  Newspaper,
  MoreVertical,
  Trash2,
  AlertTriangle,
  Loader2,
  Share2,
} from 'lucide-react'
import type { SharedResource } from '@/types/resource'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/resource'
import { ResourceDetailDialog } from '@/app/resources/components/resource-detail-dialog'
import { CreateResourceDialog } from '@/app/resources/components/create-resource-dialog'
import { useResourceForm } from '@/app/resources/hooks/use-resource-form'
import { ShareResourceDialog } from './share-resource-dialog'

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  general: FileText,
  document: FileText,
  worksheet: ClipboardList,
  exercise: Dumbbell,
  article: Newspaper,
  template: FileEdit,
  video: Video,
  link: Link2,
}

interface ClientResourcesTabProps {
  clientId: string
  clientName?: string
}

export function ClientResourcesTab({
  clientId,
  clientName,
}: ClientResourcesTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewingResource, setViewingResource] = useState<SharedResource | null>(
    null,
  )
  const [deleteResource, setDeleteResource] = useState<SharedResource | null>(
    null,
  )
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const { form, setField, resetForm, buildFormData, fileInputRef } =
    useResourceForm()

  // Fetch client-specific resources
  const { data: clientData, isLoading: loadingClient } = useResources({
    scope: 'client',
    client_id: clientId,
    search: debouncedSearch || undefined,
  })

  // Fetch global resources
  const { data: globalData, isLoading: loadingGlobal } = useResources({
    scope: 'global',
    search: debouncedSearch || undefined,
  })

  const createResource = useCreateResource()
  const deleteResourceMutation = useDeleteResource()

  const clientResources = clientData?.resources || []
  const globalResources = globalData?.resources || []
  const allResources = [...clientResources, ...globalResources]
  const isLoading = loadingClient || loadingGlobal

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

  const handleDeleteConfirm = async () => {
    if (!deleteResource) return
    await deleteResourceMutation.mutateAsync(deleteResource.id)
    setDeleteResource(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Resources ({allResources.length})
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Resources shared with {clientName || 'this client'} and global
            resources
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Resource
          </Button>
          <Button
            size="sm"
            onClick={() => {
              resetForm()
              setField('scope', 'client')
              setField('clientId', clientId)
              setCreateDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Resource
          </Button>
        </div>
      </div>

      {/* Search */}
      {allResources.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Client-specific resources section */}
      {clientResources.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Shared with {clientName || 'this client'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clientResources.map(resource => (
              <ResourceMiniCard
                key={resource.id}
                resource={resource}
                onView={r => setViewingResource(r)}
                onDelete={r => setDeleteResource(r)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Global resources section */}
      {globalResources.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1.5">
            <Globe className="h-4 w-4" />
            Global resources
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {globalResources.map(resource => (
              <ResourceMiniCard
                key={resource.id}
                resource={resource}
                onView={r => setViewingResource(r)}
                onDelete={r => setDeleteResource(r)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {allResources.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Resources Shared
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-4">
              No resources have been shared with {clientName || 'this client'}{' '}
              yet.
            </p>
            <Button
              onClick={() => {
                resetForm()
                setField('scope', 'client')
                setField('clientId', clientId)
                setCreateDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Share a Resource
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detail dialog */}
      <ResourceDetailDialog
        resource={viewingResource}
        open={!!viewingResource}
        onOpenChange={open => {
          if (!open) setViewingResource(null)
        }}
        onEdit={() => {}}
        onDelete={r => setDeleteResource(r)}
      />

      {/* Create dialog */}
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
        presetClientId={clientId}
      />

      {/* Share from library dialog */}
      <ShareResourceDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        clientId={clientId}
        clientName={clientName}
        onCreateNew={() => {
          setShareDialogOpen(false)
          resetForm()
          setField('scope', 'client')
          setField('clientId', clientId)
          setCreateDialogOpen(true)
        }}
      />

      {/* Delete confirmation */}
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
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>&quot;{deleteResource?.title}&quot;</strong>?
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
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Compact resource card for the tab
function ResourceMiniCard({
  resource,
  onView,
  onDelete,
}: {
  resource: SharedResource
  onView: (r: SharedResource) => void
  onDelete: (r: SharedResource) => void
}) {
  const Icon = CATEGORY_ICONS[resource.category] || FileText
  const colors = CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.general

  return (
    <Card
      className="border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(resource)}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.bg} shrink-0`}>
            <Icon className={`h-4 w-4 ${colors.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {resource.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0 ${colors.bg} ${colors.text} border-0`}
              >
                {CATEGORY_LABELS[resource.category]}
              </Badge>
              <span className="text-xs text-gray-400">
                {new Date(resource.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Eye className="h-3 w-3" />
            {resource.view_count}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={e => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(resource)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(resource)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
