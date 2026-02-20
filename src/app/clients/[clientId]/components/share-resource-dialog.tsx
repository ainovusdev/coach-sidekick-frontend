'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useResources } from '@/hooks/queries/use-resources'
import { useShareResource } from '@/hooks/mutations/use-resource-mutations'
import {
  BookOpen,
  FileText,
  Video,
  Link2,
  Plus,
  Check,
  Library,
  ClipboardList,
  Dumbbell,
  FileEdit,
  Newspaper,
} from 'lucide-react'
import type { SharedResource } from '@/types/resource'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/resource'

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

interface ShareResourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName?: string
  onCreateNew: () => void
}

export function ShareResourceDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  onCreateNew,
}: ShareResourceDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Fetch global resources that could be shared
  const { data, isLoading } = useResources({ scope: 'global' })
  const shareResource = useShareResource()

  const globalResources = data?.resources || []

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleShare = async () => {
    const promises = Array.from(selectedIds).map(id =>
      shareResource.mutateAsync({
        id,
        data: { sharing_scope: 'client', client_id: clientId },
      }),
    )
    await Promise.all(promises)
    setSelectedIds(new Set())
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={open => {
        onOpenChange(open)
        if (!open) setSelectedIds(new Set())
      }}
    >
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Share Resources</DialogTitle>
          <DialogDescription>
            Share resources with {clientName || 'this client'}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="library"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="library" className="gap-1.5">
              <Library className="h-4 w-4" />
              From Library
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create New
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="library"
            className="flex-1 overflow-y-auto mt-4 space-y-2"
          >
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : globalResources.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  No global resources to share. Create one first.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-2">
                  Select global resources to share with{' '}
                  {clientName || 'this client'}
                </p>
                {globalResources.map(resource => (
                  <ShareableResourceItem
                    key={resource.id}
                    resource={resource}
                    selected={selectedIds.has(resource.id)}
                    onToggle={() => toggleSelect(resource.id)}
                  />
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="new" className="mt-4">
            <div className="flex flex-col items-center justify-center py-8">
              <Plus className="h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-4 text-center">
                Create a new resource specifically for{' '}
                {clientName || 'this client'}
              </p>
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Resource
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {selectedIds.size > 0 && (
          <DialogFooter className="pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setSelectedIds(new Set())}>
              Clear ({selectedIds.size})
            </Button>
            <Button
              onClick={handleShare}
              disabled={shareResource.isPending}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {shareResource.isPending
                ? 'Sharing...'
                : `Share ${selectedIds.size} Resource${selectedIds.size > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ShareableResourceItem({
  resource,
  selected,
  onToggle,
}: {
  resource: SharedResource
  selected: boolean
  onToggle: () => void
}) {
  const Icon = CATEGORY_ICONS[resource.category] || FileText
  const colors = CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.general

  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
        selected
          ? 'border-gray-900 bg-gray-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
          selected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
        }`}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </div>
      <div className={`p-1.5 rounded ${colors.bg} shrink-0`}>
        <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {resource.title}
        </p>
        {resource.description && (
          <p className="text-xs text-gray-500 truncate">
            {resource.description}
          </p>
        )}
      </div>
      <Badge
        variant="secondary"
        className={`text-[10px] shrink-0 ${colors.bg} ${colors.text} border-0`}
      >
        {CATEGORY_LABELS[resource.category]}
      </Badge>
    </div>
  )
}
