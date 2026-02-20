'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  FileText,
  Video,
  Link2,
  ClipboardList,
  Dumbbell,
  Newspaper,
  FileEdit,
  Plus,
  Loader2,
  Trash2,
  Eye,
  MoreVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useResources } from '@/hooks/queries/use-resources'
import {
  useCreateResource,
  useDeleteResource,
} from '@/hooks/mutations/use-resource-mutations'
import { useResourceForm } from '@/app/resources/hooks/use-resource-form'
import { CreateResourceDialog } from '@/app/resources/components/create-resource-dialog'
import { ResourceDetailDialog } from '@/app/resources/components/resource-detail-dialog'
import type { SharedResource } from '@/types/resource'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/resource'
import { formatDate } from '@/lib/date-utils'

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

interface SessionResourcesCompactProps {
  sessionId: string
  clientId?: string
  isViewer?: boolean
}

export function SessionResourcesCompact({
  sessionId,
  clientId,
  isViewer = false,
}: SessionResourcesCompactProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewingResource, setViewingResource] = useState<SharedResource | null>(
    null,
  )
  const [deleteResource, setDeleteResource] = useState<SharedResource | null>(
    null,
  )
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const { form, setField, resetForm, buildFormData, fileInputRef } =
    useResourceForm()

  const { data, isLoading } = useResources({
    scope: 'session',
    session_id: sessionId,
  })

  const createResource = useCreateResource()
  const deleteResourceMutation = useDeleteResource()

  const resources = data?.resources || []

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

  const handleOpenCreate = () => {
    resetForm()
    setField('scope', 'session')
    setField('sessionId', sessionId)
    if (clientId) setField('clientId', clientId)
    setCreateDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteResource) return
    await deleteResourceMutation.mutateAsync(deleteResource.id)
    setDeleteResource(null)
  }

  return (
    <Card className="border-app-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-app-secondary" />
            <h3 className="text-sm font-semibold text-app-primary">
              Session Resources
            </h3>
            {resources.length > 0 && (
              <span className="text-xs text-app-secondary">
                ({resources.length})
              </span>
            )}
          </div>
          {!isViewer && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleOpenCreate}
                size="sm"
                className="bg-app-primary hover:bg-app-primary/90 text-white text-xs"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Add
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-app-secondary" />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-app-surface rounded-lg mb-3">
              <BookOpen className="h-5 w-5 text-app-secondary" />
            </div>
            <p className="text-sm text-app-secondary">No resources yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {resources.map(resource => {
              const Icon = CATEGORY_ICONS[resource.category] || FileText
              const colors =
                CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.general

              return (
                <div
                  key={resource.id}
                  className="flex items-center gap-3 p-3 bg-app-surface rounded-lg border border-app-border hover:border-app-border transition-colors cursor-pointer"
                  onClick={() => setViewingResource(resource)}
                >
                  <div
                    className={`p-1.5 rounded-md ${colors.bg} flex-shrink-0`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-app-primary truncate">
                      {resource.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 ${colors.bg} ${colors.text} border-0`}
                      >
                        {CATEGORY_LABELS[resource.category]}
                      </Badge>
                      <span className="text-xs text-app-secondary">
                        {formatDate(resource.created_at)}
                      </span>
                    </div>
                  </div>
                  {!isViewer && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 flex-shrink-0"
                          onClick={e => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setViewingResource(resource)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteResource(resource)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

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

      {/* Resource Detail Dialog */}
      <ResourceDetailDialog
        resource={viewingResource}
        open={!!viewingResource}
        onOpenChange={open => {
          if (!open) setViewingResource(null)
        }}
        onEdit={() => {}}
        onDelete={r => {
          setViewingResource(null)
          setDeleteResource(r)
        }}
      />

      {/* Delete Confirmation */}
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
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteResource?.title}
              &quot;?
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
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
