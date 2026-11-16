'use client'

import { useState } from 'react'
import { Lock, MoreVertical, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useDeleteClientResource,
  useUpdateClientResource,
} from '@/hooks/mutations/use-client-resource-mutations'
import type { ClientResource } from '@/types/resource'

/** Edit / share-toggle / delete for a coachee's own upload. */
export function OwnUploadActions({ resource }: { resource: ClientResource }) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [title, setTitle] = useState(resource.title)
  const [description, setDescription] = useState(resource.description ?? '')
  const update = useUpdateClientResource()
  const remove = useDeleteClientResource()

  const toggleSharing = () => {
    const nextPrivate = !resource.is_private
    update.mutate(
      { id: resource.id, data: { is_private: nextPrivate } },
      {
        onSuccess: () =>
          toast.success(
            nextPrivate ? 'Now private' : 'Shared with your coach',
            { description: resource.title },
          ),
      },
    )
  }

  const saveEdit = () => {
    if (!title.trim()) return
    update.mutate(
      {
        id: resource.id,
        data: { title: title.trim(), description: description.trim() || null },
      },
      { onSuccess: () => setEditing(false) },
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-ink-4 hover:text-ink-2"
            aria-label={`Options for ${resource.title}`}
            onClick={e => e.stopPropagation()}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setTitle(resource.title)
              setDescription(resource.description ?? '')
              setEditing(true)
            }}
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleSharing} disabled={update.isPending}>
            {resource.is_private ? (
              <Users className="mr-2 h-3.5 w-3.5" />
            ) : (
              <Lock className="mr-2 h-3.5 w-3.5" />
            )}
            {resource.is_private ? 'Share with my coach' : 'Make private'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-vermillion focus:text-vermillion"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={`edit-title-${resource.id}`}>Title</Label>
              <Input
                id={`edit-title-${resource.id}`}
                maxLength={255}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`edit-desc-${resource.id}`}>Note</Label>
              <Textarea
                id={`edit-desc-${resource.id}`}
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={!title.trim() || update.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
            <AlertDialogDescription>
              “{resource.title}” will be removed from your profile
              {resource.is_private
                ? ''
                : ' and your coach will no longer see it'}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-vermillion text-paper hover:bg-vermillion/90"
              onClick={() => remove.mutate(resource.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
