'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  BookOpen,
  Plus,
  Search,
  Trash2,
  Pencil,
  AlertTriangle,
  Loader2,
  FileText,
  Link2,
  ExternalLink,
  RefreshCw,
  Eye,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CreateResourceDialog } from '@/app/resources/components/create-resource-dialog'
import { EditResourceDialog } from '@/app/resources/components/edit-resource-dialog'
import { useResourceForm } from '@/app/resources/hooks/use-resource-form'
import authService from '@/services/auth-service'
import { toast } from 'sonner'
import { formatDate } from '@/lib/date-utils'
import type { ResourceCategory } from '@/types/resource'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface AdminResource {
  id: string
  title: string
  description: string | null
  content: string | null
  content_url: string | null
  file_url: string | null
  resource_type: string
  category: string
  sharing_scope: string
  tags: string[]
  coach_id: string
  created_at: string | null
  updated_at: string | null
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<AdminResource[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminResource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [editTarget, setEditTarget] = useState<AdminResource | null>(null)
  const [viewingResource, setViewingResource] = useState<AdminResource | null>(
    null,
  )
  const [isEditing, setIsEditing] = useState(false)

  const { form, setField, resetForm, buildFormData, fileInputRef } =
    useResourceForm()

  const fetchResources = async () => {
    try {
      const token = authService.getToken()
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)

      const response = await fetch(`${BACKEND_URL}/admin/resources?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch resources')
      const data = await response.json()
      setResources(data.resources || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to fetch global resources:', err)
      toast.error('Failed to load global resources')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [debouncedSearch])

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  // Force scope to global when dialog opens
  useEffect(() => {
    if (createDialogOpen) {
      setField('scope', 'global')
    }
  }, [createDialogOpen, setField])

  const handleCreate = async () => {
    setField('scope', 'global')
    const formData = buildFormData()
    // Ensure scope is global
    formData.set('sharing_scope', 'global')
    const hasFile = formData.has('file')
    if (hasFile) setUploadProgress(0)

    try {
      const token = authService.getToken()

      if (hasFile) {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', `${BACKEND_URL}/resources/`)
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

          xhr.upload.onprogress = e => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100))
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error('Upload failed'))
            }
          }

          xhr.onerror = () => reject(new Error('Network error'))
          xhr.send(formData)
        })
      } else {
        const response = await fetch(`${BACKEND_URL}/resources/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })
        if (!response.ok) throw new Error('Failed to create resource')
      }

      toast.success('Global resource created')
      setCreateDialogOpen(false)
      resetForm()
      fetchResources()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create resource')
    } finally {
      setUploadProgress(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const token = authService.getToken()
      const response = await fetch(
        `${BACKEND_URL}/admin/resources/${deleteTarget.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      if (!response.ok) throw new Error('Failed to delete resource')
      toast.success('Resource deleted')
      setDeleteTarget(null)
      fetchResources()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete resource')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditOpen = (resource: AdminResource) => {
    setEditTarget(resource)
    setField('title', resource.title)
    setField('description', resource.description || '')
    setField('category', (resource.category || 'general') as ResourceCategory)
    setField('tags', (resource.tags || []).join(', '))
    setField('scope', 'global')
  }

  const handleEditSave = async () => {
    if (!editTarget) return
    setIsEditing(true)
    try {
      const token = authService.getToken()
      const updateData: Record<string, unknown> = {
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        tags: form.tags
          ? form.tags
              .split(',')
              .map(t => t.trim())
              .filter(Boolean)
          : [],
      }

      const response = await fetch(
        `${BACKEND_URL}/admin/resources/${editTarget.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        },
      )
      if (!response.ok) throw new Error('Failed to update resource')
      toast.success('Resource updated')
      setEditTarget(null)
      resetForm()
      fetchResources()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update resource')
    } finally {
      setIsEditing(false)
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      document: 'bg-ds-accent-bg text-ds-accent ',
      worksheet: 'bg-forest-bg text-forest ',
      video: 'bg-indigo-bg text-indigo ',
      template: 'bg-amber-token-bg text-amber-token ',
      link: 'bg-ds-accent-bg text-ds-accent ',
      general: 'bg-surface-3 text-ink-2 ',
    }
    return colors[category] || colors.general
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink ">Global Resources</h1>
          <p className="text-sm text-ink-3 mt-1">
            Manage resources available to all coaches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchResources()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setCreateDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Global Resource
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-4" />
        <Input
          placeholder="Search global resources..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Count */}
      <p className="text-sm text-ink-3 ">
        {total} global resource{total !== 1 ? 's' : ''}
      </p>

      {/* Resources List */}
      {resources.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-line-strong rounded-lg">
          <BookOpen className="h-12 w-12 text-ink-4 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ink mb-2">
            No Global Resources
          </h3>
          <p className="text-ink-3 mb-4">
            Add resources that will be available to all coaches.
          </p>
          <Button
            onClick={() => {
              resetForm()
              setCreateDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Resource
          </Button>
        </div>
      ) : (
        <div className="border border-line rounded-lg overflow-hidden bg-surface-1 ">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-paper ">
                <th className="text-left px-4 py-3 text-xs font-medium text-ink-3 uppercase">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-ink-3 uppercase">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-ink-3 uppercase">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-ink-3 uppercase">
                  Created
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-ink-3 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line ">
              {resources.map(resource => (
                <tr
                  key={resource.id}
                  className="hover:bg-paper transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
                        {resource.file_url ? (
                          <FileText className="h-4 w-4 text-ink-3" />
                        ) : resource.content_url ? (
                          <Link2 className="h-4 w-4 text-ink-3" />
                        ) : (
                          <BookOpen className="h-4 w-4 text-ink-3" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {resource.title}
                        </p>
                        {resource.description && (
                          <p className="text-xs text-ink-3 truncate max-w-xs">
                            {resource.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getCategoryBadge(resource.category)}>
                      {resource.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-ink-3 capitalize">
                      {resource.file_url
                        ? 'File'
                        : resource.content_url
                          ? 'Link'
                          : 'Text'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-ink-3 ">
                      {resource.created_at
                        ? formatDate(resource.created_at, 'MMM d, yyyy')
                        : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewingResource(resource)}
                        className="p-1.5 text-ink-4 hover:text-ink-3 rounded transition-colors"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {(resource.file_url || resource.content_url) && (
                        <a
                          href={resource.file_url || resource.content_url || ''}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-ink-4 hover:text-ink-3 rounded transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleEditOpen(resource)}
                        className="p-1.5 text-ink-4 hover:text-ds-accent rounded transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(resource)}
                        className="p-1.5 text-ink-4 hover:text-vermillion rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        isPending={false}
        uploadProgress={uploadProgress}
      />

      {/* Edit Resource Dialog */}
      <EditResourceDialog
        open={!!editTarget}
        onOpenChange={open => {
          if (!open) {
            setEditTarget(null)
            resetForm()
          }
        }}
        form={form}
        setField={setField}
        onSubmit={handleEditSave}
        isPending={isEditing}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={open => {
          if (!isDeleting && !open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-vermillion-bg rounded-full">
                <AlertTriangle className="h-5 w-5 text-vermillion" />
              </div>
              <AlertDialogTitle>Delete Global Resource</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?
              This will remove it from all coaches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-vermillion hover:bg-vermillion"
            >
              {isDeleting ? (
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

      {/* View Resource Dialog */}
      <Dialog
        open={!!viewingResource}
        onOpenChange={open => {
          if (!open) setViewingResource(null)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingResource?.title}</DialogTitle>
          </DialogHeader>
          {viewingResource?.description && (
            <p className="text-sm text-ink-3 ">{viewingResource.description}</p>
          )}
          {viewingResource?.content ? (
            <div className="p-4 bg-paper rounded-lg text-sm text-ink-2 whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
              {viewingResource.content}
            </div>
          ) : viewingResource?.file_url ? (
            <div className="flex items-center gap-3 p-3 bg-paper rounded-lg">
              <FileText className="h-5 w-5 text-ink-3" />
              <span className="flex-1 text-sm truncate">
                {viewingResource.file_url}
              </span>
              <a
                href={viewingResource.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ds-accent text-sm font-medium hover:underline"
              >
                Open
              </a>
            </div>
          ) : viewingResource?.content_url ? (
            <div className="flex items-center gap-3 p-3 bg-paper rounded-lg">
              <Link2 className="h-5 w-5 text-ink-3" />
              <span className="flex-1 text-sm text-ds-accent truncate">
                {viewingResource.content_url}
              </span>
              <a
                href={viewingResource.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ds-accent text-sm font-medium hover:underline"
              >
                Open
              </a>
            </div>
          ) : (
            <div className="p-4 bg-paper rounded-lg text-center text-sm text-ink-4">
              No content
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <Badge variant="outline" className="text-xs capitalize">
              {viewingResource?.sharing_scope}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {viewingResource?.category}
            </Badge>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
