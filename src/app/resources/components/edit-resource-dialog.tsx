'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ResourceCategory } from '@/types/resource'
import type { ResourceFormState } from '../hooks/use-resource-form'

interface EditResourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: ResourceFormState
  setField: <K extends keyof ResourceFormState>(
    key: K,
    value: ResourceFormState[K],
  ) => void
  onSubmit: () => Promise<void>
  isPending: boolean
}

export function EditResourceDialog({
  open,
  onOpenChange,
  form,
  setField,
  onSubmit,
  isPending,
}: EditResourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>Update resource details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <select
              id="edit-category"
              value={form.category}
              onChange={e =>
                setField('category', e.target.value as ResourceCategory)
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="general">General</option>
              <option value="worksheet">Worksheet</option>
              <option value="exercise">Exercise</option>
              <option value="article">Article</option>
              <option value="template">Template</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
              <option value="link">Link</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
            <Input
              id="edit-tags"
              value={form.tags}
              onChange={e => setField('tags', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="pt-4 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!form.title.trim() || isPending}
            className="bg-gray-900 hover:bg-gray-800"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
